import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { put, del } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up Multer for multipart form uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP, GIF, AVIF) are allowed.'));
    }
  },
});

// Products persistence file path on local disk
const DATA_DIR = path.resolve(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INITIAL_FURNITURE_PRODUCTS = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    price: 480,
    category: 'Living Room',
    isPublished: true,
    images: [
      {
        id: 'img-f1-1',
        url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_oak_chair.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'prod-f2',
    name: 'Minimalist Walnut Dining Table',
    description: 'Six-seater contemporary dining table crafted from sustainable American walnut with matte protective finish. Elegant bevelled edges and solid joinery.',
    price: 920,
    category: 'Dining Room',
    isPublished: true,
    images: [
      {
        id: 'img-f2-1',
        url: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
        name: 'walnut_dining_table.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'prod-f3',
    name: 'Bouclé Cloud Modular Sofa',
    description: 'Deep-seat modular 3-piece sectional sofa covered in ivory bouclé fabric. High-density foam core with feather blend topper for ultimate comfort.',
    price: 1650,
    category: 'Living Room',
    isPublished: true,
    images: [
      {
        id: 'img-f3-1',
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
        name: 'boucle_sofa.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(INITIAL_FURNITURE_PRODUCTS, null, 2), 'utf-8');
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Failed to load products from disk:', err);
  }
  return INITIAL_FURNITURE_PRODUCTS;
}

function saveProducts(products: any[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save products to disk:', err);
  }
}

// -------------------------------------------------------------
// 1. API: Admin Authentication
// -------------------------------------------------------------
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body || {};
  const serverPassword = process.env.ADMIN_PASSWORD || 'trust2026';

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === serverPassword) {
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
app.get(['/api/blob/status', '/api/blob-status'], (req: Request, res: Response) => {
  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const isConfigured = Boolean(token && token.trim().length > 0);
  let masked = '';
  if (isConfigured && token) {
    masked = `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
  }

  res.json({
    connected: isConfigured,
    tokenConfigured: isConfigured,
    maskedToken: masked,
    storeName: 'test23-blob',
    message: isConfigured
      ? 'Connected to real Vercel Blob store (test23-blob). Real CDN URLs will be generated.'
      : 'BLOB_READ_WRITE_TOKEN or Vercel OIDC provides storage in production.',
  });
});

// -------------------------------------------------------------
// 3. API: Upload Image to Vercel Blob (NO FAKE / LOCAL FALLBACK)
// -------------------------------------------------------------
app.post(
  '/api/upload',
  upload.array('images', 10),
  async (req: Request, res: Response) => {
    const explicitToken = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
    const token = explicitToken && explicitToken.trim().length > 0 ? explicitToken.trim() : undefined;

    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No image file was selected for upload.' });
      }

      const uploadedImages = [];

      for (const file of files) {
        const timestamp = Date.now();
        const cleanName = sanitizeFileName(file.originalname);
        const filename = `products/${timestamp}-${cleanName}`;

        // Call real @vercel/blob put()
        const blob = await put(filename, file.buffer, {
          access: 'public',
          token: token ? token.trim() : undefined,
          contentType: file.mimetype,
        });

        uploadedImages.push({
          id: `img-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
          url: blob.url,
          pathname: blob.pathname,
          name: file.originalname,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        });
      }

      return res.json({
        success: true,
        files: uploadedImages,
      });
    } catch (error: any) {
      console.error('Real Vercel Blob upload failed:', error);
      // DO NOT FALL BACK TO LOCAL STORAGE OR FAKE URL!
      return res.status(500).json({
        error: `Vercel Blob upload failed: ${error.message || 'Unknown Blob error'}`,
        details: error.toString(),
      });
    }
  }
);

// -------------------------------------------------------------
// 3. API: Client Upload Handler (@vercel/blob/client handleUpload)
// -------------------------------------------------------------
app.post('/api/blob-upload', async (req: Request, res: Response) => {
  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN is missing for client-upload generation.',
    });
  }

  try {
    const body = req.body as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request: req,
      token: token.trim(),
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Client upload failed' });
  }
});

// -------------------------------------------------------------
// 4. API: Delete Image from Vercel Blob
// -------------------------------------------------------------
app.delete('/api/delete-image', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required for deletion.' });
    }

    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

    if (url.includes('blob.vercel-storage.com') && token) {
      await del(url, { token: token.trim() });
    }

    return res.json({
      success: true,
      message: 'Image deleted from Vercel Blob store successfully.',
      deletedUrl: url,
    });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return res.status(500).json({
      error: `Failed to delete image: ${error.message || 'Unknown error'}`,
    });
  }
});

// -------------------------------------------------------------
// 5. Products Database APIs (Persistent, NOT localStorage)
// -------------------------------------------------------------
app.get('/api/products', (req: Request, res: Response) => {
  const products = loadProducts();
  const includeUnpublished = req.query.all === 'true' || req.query.admin === 'true';
  const result = includeUnpublished ? products : products.filter((p: any) => p.isPublished !== false);
  res.json({ products: result });
});

app.post('/api/products', (req: Request, res: Response) => {
  try {
    const newProduct = req.body;
    if (!newProduct || !newProduct.name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    const current = loadProducts();
    const productToSave = {
      ...newProduct,
      id: newProduct.id || `prod-f${Date.now()}`,
      createdAt: newProduct.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    current.unshift(productToSave);
    saveProducts(current);
    res.status(201).json({ success: true, product: productToSave });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const handleUpdateProduct = (req: Request, res: Response) => {
  try {
    const id = req.params.id || (req.query.id as string) || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required for update' });
    }
    const updated = req.body;
    let current = loadProducts();
    current = current.map((p: any) =>
      p.id === id ? { ...p, ...updated, updatedAt: new Date().toISOString() } : p
    );
    saveProducts(current);
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const handleDeleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id || (req.query.id as string) || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: 'Product ID is required for deletion' });
    }
    let current = loadProducts();
    const productToDelete = current.find((p: any) => p.id === id);

    // Delete images from Vercel Blob if available
    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
    if (productToDelete?.images?.length && token) {
      for (const img of productToDelete.images) {
        if (img.url?.includes('blob.vercel-storage.com')) {
          try {
            await del(img.url, { token: token.trim() });
          } catch (e) {
            console.warn('Could not delete blob image:', e);
          }
        }
      }
    }

    current = current.filter((p: any) => p.id !== id);
    saveProducts(current);
    res.json({ success: true, message: 'Product deleted from database successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.put('/api/products', handleUpdateProduct);
app.put('/api/products/:id', handleUpdateProduct);
app.delete('/api/products', handleDeleteProduct);
app.delete('/api/products/:id', handleDeleteProduct);

app.post('/api/products/reset', (_req: Request, res: Response) => {
  saveProducts(INITIAL_FURNITURE_PRODUCTS);
  res.json({ success: true, products: INITIAL_FURNITURE_PRODUCTS });
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
    console.log(`Furniture Store server running on port ${PORT}`);
  });
}

startServer();
