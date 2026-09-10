import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import {
  buildSnapshot,
  buildWorkbookFromDataset,
  buildWordReport,
  normalizeDatasetFromMapping,
  parseWorkbookBuffer,
  suggestColumnMappings
} from './src/server/intelligence-service.js';
import { createDatasetStore } from './src/server/dataset-store.js';
import { createSecurityMiddleware, handleApiError, requireAccessToken } from './src/server/security.js';
import { config } from './src/server/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxUploadBytes,
    files: 1
  }
});
const store = createDatasetStore({ ttlMs: config.sessionTtlMs });
const staticRoot = config.isProduction ? path.join(__dirname, 'build') : __dirname;

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(createSecurityMiddleware(config));

const filterSchema = z.object({
  municipality: z.string().default('ALL'),
  territory: z.string().default('ALL'),
  organ: z.string().default('ALL'),
  status: z.string().default('ALL'),
  search: z.string().default('')
});

const pagingSchema = z.object({
  currentPage: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25)
});

const mappingSchema = z.object({
  muni: z.string().optional().default(''),
  territorio: z.string().optional().default(''),
  organ: z.string().optional().default(''),
  desc: z.string().optional().default(''),
  val: z.string().optional().default(''),
  status: z.string().optional().default('')
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', environment: config.environment });
});

app.post('/api/datasets/upload', requireAccessToken(config), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ error: 'Nenhum arquivo foi enviado.' });
      return;
    }

    const parsed = parseWorkbookBuffer(req.file.buffer, req.file.originalname || 'planilha');
    const datasetId = randomUUID();
    const availableColumns = parsed.columns;
    const columnMappings = suggestColumnMappings(parsed.jsonRows);

    store.set(datasetId, {
      id: datasetId,
      datasetLabel: req.file.originalname || 'Planilha do Usuário',
      importedSheetName: parsed.sheetName,
      aoa: parsed.aoa,
      jsonRows: parsed.jsonRows,
      columns: availableColumns,
      createdAt: Date.now()
    });

    res.json({
      datasetId,
      datasetLabel: req.file.originalname || 'Planilha do Usuário',
      importedSheetName: parsed.sheetName,
      availableColumns,
      columnMappings,
      totalRows: parsed.jsonRows.length
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/datasets/:datasetId/mapping', requireAccessToken(config), async (req, res, next) => {
  try {
    const dataset = store.get(req.params.datasetId);

    if (!dataset) {
      res.status(404).json({ error: 'Sessão da planilha não encontrada ou expirada.' });
      return;
    }

    const mappings = mappingSchema.parse(req.body ?? {});
    const normalized = normalizeDatasetFromMapping(dataset, mappings);

    store.set(req.params.datasetId, {
      ...dataset,
      ...normalized,
      columnMappings: mappings,
      updatedAt: Date.now()
    });

    res.json(buildSnapshot(store.get(req.params.datasetId), {
      filters: filterSchema.parse({}),
      currentPage: 1,
      pageSize: 25
    }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/datasets/:datasetId/query', requireAccessToken(config), async (req, res, next) => {
  try {
    const dataset = store.get(req.params.datasetId);

    if (!dataset?.normalizedRecords) {
      res.status(404).json({ error: 'Dados da planilha não encontrados. Reimporte o arquivo.' });
      return;
    }

    const filters = filterSchema.parse(req.body?.filters ?? {});
    const paging = pagingSchema.parse({
      currentPage: req.body?.currentPage,
      pageSize: req.body?.pageSize
    });

    res.json(buildSnapshot(dataset, {
      filters,
      currentPage: paging.currentPage,
      pageSize: paging.pageSize
    }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/datasets/:datasetId/exports/excel', requireAccessToken(config), async (req, res, next) => {
  try {
    const dataset = store.get(req.params.datasetId);

    if (!dataset?.normalizedRecords) {
      res.status(404).json({ error: 'Dados da planilha não encontrados. Reimporte o arquivo.' });
      return;
    }

    const filters = filterSchema.parse(req.body?.filters ?? {});
    const workbook = buildWorkbookFromDataset(dataset, filters);
    const buffer = Buffer.from(workbook, 'binary');
    const outputName = `planilha_tratada_${new Date().toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${outputName}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

app.post('/api/datasets/:datasetId/exports/word', requireAccessToken(config), async (req, res, next) => {
  try {
    const dataset = store.get(req.params.datasetId);

    if (!dataset?.normalizedRecords) {
      res.status(404).json({ error: 'Dados da planilha não encontrados. Reimporte o arquivo.' });
      return;
    }

    const filters = filterSchema.parse(req.body?.filters ?? {});
    const report = await buildWordReport({
      dataset,
      filters,
      templatePath: path.join(__dirname, 'TIMBRADO_JERO_template.docx')
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    res.send(report.buffer);
  } catch (error) {
    next(error);
  }
});

app.use(express.static(staticRoot, {
  extensions: ['html'],
  index: false,
  etag: true,
  fallthrough: true,
  maxAge: config.isProduction ? '1h' : 0
}));

app.get('/', (_req, res) => {
  res.sendFile(path.join(staticRoot, 'main.html'));
});

app.use('/api', handleApiError(config));
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

app.listen(config.port, () => {
  console.log(`sistema disponível em ${config.baseUrl}`);
});
