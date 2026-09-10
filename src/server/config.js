import dotenv from 'dotenv';

dotenv.config();

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function splitOrigins(value, fallback) {
  const raw = String(value ?? fallback ?? '').trim();
  if (!raw) return [];
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

const environment = process.env.NODE_ENV || process.env.APP_ENV || 'development';
const port = toInt(process.env.PORT, 3000);
const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;

export const config = {
  environment,
  isProduction: environment === 'production',
  port,
  baseUrl,
  allowedOrigins: splitOrigins(process.env.ALLOWED_ORIGINS, baseUrl),
  accessToken: String(process.env.APP_ACCESS_TOKEN || '').trim(),
  sessionTtlMs: toInt(process.env.SESSION_TTL_MINUTES, 30) * 60 * 1000,
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 120),
  maxUploadBytes: toInt(process.env.MAX_UPLOAD_MB, 12) * 1024 * 1024
};
