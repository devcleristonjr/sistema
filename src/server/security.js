import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';

function getSelfOrigin(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function normalizeOrigin(origin) {
  if (!origin) return '';

  try {
    const parsed = new URL(String(origin));
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    let normalized = String(origin).trim().toLowerCase();
    while (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
}

function isSameHostAsRequest(origin, req) {
  try {
    const parsedOrigin = new URL(String(origin));
    const requestHost = String(req.get('host') || '').trim().toLowerCase();
    return Boolean(requestHost) && parsedOrigin.host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin, req, config) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  const allowed = new Set([normalizeOrigin(getSelfOrigin(req)), ...config.allowedOrigins.map(normalizeOrigin)]);

  return allowed.has(normalizedOrigin) || isSameHostAsRequest(origin, req);
}

export function requireAccessToken(config) {
  return (req, res, next) => {
    if (!config.accessToken) {
      next();
      return;
    }

    const provided = String(req.get('x-app-access-token') || '').trim();

    if (!provided) {
      res.setHeader('x-auth-required', 'true');
      res.status(401).json({ error: 'Token de acesso não informado.' });
      return;
    }

    const expectedBuffer = Buffer.from(config.accessToken);
    const providedBuffer = Buffer.from(provided);
    const valid = expectedBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!valid) {
      res.setHeader('x-auth-required', 'true');
      res.status(401).json({ error: 'Token de acesso inválido.' });
      return;
    }

    next();
  };
}

export function createSecurityMiddleware(config) {
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMaxRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: (req) => !req.path.startsWith('/api/'),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Limite de requisições excedido. Tente novamente em instantes.' });
    }
  });

  const corsMiddleware = cors({
    origin(origin, callback) {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-App-Access-Token'],
    credentials: false
  });

  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  });

  return [
    (req, res, next) => {
      if (!isAllowedOrigin(req.get('origin'), req, config)) {
        res.status(403).json({ error: 'Origem não autorizada.' });
        return;
      }
      next();
    },
    corsMiddleware,
    helmetMiddleware,
    limiter
  ];
}

export function handleApiError(config) {
  return (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'Requisição inválida.', details: error.issues });
      return;
    }

    if (error?.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'Arquivo acima do limite configurado para upload.' });
      return;
    }

    const status = Number.isInteger(error?.statusCode) ? error.statusCode : 500;

    res.status(status).json({
      error: status >= 500 ? 'Erro interno ao processar a requisição.' : (error?.message || 'Erro na requisição.'),
      ...(config.isProduction ? {} : { debug: error?.message })
    });
  };
}
