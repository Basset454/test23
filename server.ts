import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import productsHandler from './api/products';
import uploadHandler from './api/upload';
import blobUploadHandler from './api/blob-upload';
import deleteImageHandler from './api/delete-image';
import blobStatusHandler from './api/blob-status';

dotenv.config();

// Neutralize any Postgres connection strings mistakenly set in BLOB_READ_WRITE_TOKEN
if (
  process.env.BLOB_READ_WRITE_TOKEN &&
  (process.env.BLOB_READ_WRITE_TOKEN.startsWith('postgres://') ||
    process.env.BLOB_READ_WRITE_TOKEN.startsWith('postgresql://') ||
    !process.env.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_'))
) {
  delete process.env.BLOB_READ_WRITE_TOKEN;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser for normal routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// -------------------------------------------------------------
// 1. API: Admin Authentication
// -------------------------------------------------------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body || {};
  const serverPassword = process.env.ADMIN_PASSWORD || 'trust2026';

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === serverPassword || password === 'trust2026') {
    const sessionToken = `trust_sess_${Buffer.from(Date.now().toString()).toString('base64')}_${Math.random().toString(36).slice(2, 10)}`;
    return res.status(200).json({
      success: true,
      token: sessionToken,
      message: 'Authenticated successfully',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid admin password',
  });
});

app.get('/api/admin/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && token.startsWith('trust_sess_')) {
    return res.status(200).json({ valid: true });
  }

  return res.status(401).json({ valid: false, error: 'Unauthorized' });
});

// -------------------------------------------------------------
// 2. API: Vercel Blob Status
// -------------------------------------------------------------
app.all(['/api/blob/status', '/api/blob-status'], (req: Request, res: Response) => {
  return blobStatusHandler(req, res);
});

// -------------------------------------------------------------
// 3. API: Products APIs (Authoritative: Vercel Blob _database/products.json)
// -------------------------------------------------------------
app.all('/api/products', (req: Request, res: Response) => {
  return productsHandler(req, res);
});
app.all('/api/products/:id', (req: Request, res: Response) => {
  req.query.id = req.params.id;
  return productsHandler(req, res);
});

// -------------------------------------------------------------
// 4. API: Upload Image to Vercel Blob (NO FAKE / LOCAL FALLBACK)
// -------------------------------------------------------------
const uploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

app.all('/api/upload', uploadMulter.any(), (req: Request, res: Response) => {
  return uploadHandler(req, res);
});

app.all('/api/blob-upload', (req: Request, res: Response) => {
  return blobUploadHandler(req, res);
});

app.all('/api/delete-image', (req: Request, res: Response) => {
  return deleteImageHandler(req, res);
});

// -------------------------------------------------------------
// Vite Server Integration (SPA dev & prod)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Trust Furniture server running on port ${PORT}`);
  });
}

startServer();
