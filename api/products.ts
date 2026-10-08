import fs from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const INITIAL_FALLBACK_PRODUCTS = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    price: 480,
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1000&auto=format&fit=crop&q=80',
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
    price: 920,
    description: 'Six-seater contemporary dining table crafted from sustainable American walnut with matte protective finish. Elegant bevelled edges and solid joinery.',
    category: 'Dining Room',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=1000&auto=format&fit=crop&q=80',
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
    price: 1650,
    description: 'Deep-seat modular 3-piece sectional sofa covered in ivory bouclé fabric. High-density foam core with feather blend topper for ultimate comfort.',
    category: 'Living Room',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&auto=format&fit=crop&q=80',
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

let memoryProductsCache: any[] | null = null;
let lastBlobDbUrl: string | null = null;

async function loadProducts(token?: string): Promise<any[]> {
  // 1. Try reading from Vercel Blob persistent database if possible
  try {
    const effectiveToken = token || process.env.BLOB_READ_WRITE_TOKEN || undefined;
    if (lastBlobDbUrl) {
      const res = await fetch(lastBlobDbUrl, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryProductsCache = data;
          return data;
        }
      }
    }

    const { blobs } = await list({
      prefix: '_database/products.json',
      token: effectiveToken,
    });

    if (blobs && blobs.length > 0) {
      lastBlobDbUrl = blobs[0].url;
      const res = await fetch(blobs[0].url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryProductsCache = data;
          return data;
        }
      }
    }
  } catch (blobErr) {
    // If Blob listing not yet initialized or network error, fallback to local/cache
  }

  // 2. Return in-memory cache if available
  if (memoryProductsCache && memoryProductsCache.length > 0) {
    return memoryProductsCache;
  }

  // 3. Try reading from local disk (dev / local environment)
  try {
    if (fs.existsSync(LOCAL_PRODUCTS_FILE)) {
      const data = fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryProductsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    // Filesystem may be read-only in some Vercel lambdas
  }

  memoryProductsCache = INITIAL_FALLBACK_PRODUCTS;
  return INITIAL_FALLBACK_PRODUCTS;
}

async function persistProducts(products: any[], token?: string) {
  memoryProductsCache = products;

  // 1. Persist to local disk if writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // Read-only serverless environment
  }

  // 2. Persist to Vercel Blob storage (canonical persistent database across cold starts)
  try {
    const effectiveToken = token || process.env.BLOB_READ_WRITE_TOKEN || undefined;
    const blob = await put('_database/products.json', JSON.stringify(products), {
      access: 'public',
      token: effectiveToken,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    lastBlobDbUrl = blob.url;
  } catch (blobSaveErr) {
    console.warn('Persistent Blob database sync warning:', blobSaveErr);
  }
}

function normalizeProduct(raw: any) {
  const images = Array.isArray(raw.images) ? raw.images : [];
  const coverObj = images.find((i: any) => i.isCover) || images[0];
  const coverImageUrl = raw.coverImageUrl || coverObj?.url || '';

  return {
    id: raw.id || `prod-f${Date.now()}`,
    name: String(raw.name || '').trim(),
    price: Number(raw.price) || 0,
    description: String(raw.description || '').trim(),
    category: String(raw.category || 'Living Room').trim(),
    images,
    coverImageUrl,
    isPublished: raw.isPublished !== undefined ? Boolean(raw.isPublished) : true,
    isFeatured: Boolean(raw.isFeatured),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const products = await loadProducts(token);

    // GET /api/products
    if (req.method === 'GET') {
      const includeUnpublished = req.query.all === 'true' || req.query.admin === 'true';
      const result = includeUnpublished
        ? products
        : products.filter((p: any) => p.isPublished !== false);
      return res.status(200).json({ products: result });
    }

    // Parse request body for mutations
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }

    // POST /api/products (Create new product)
    if (req.method === 'POST') {
      if (!body || !body.name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const productToInsert = normalizeProduct(body);
      const updatedList = [productToInsert, ...products];
      await persistProducts(updatedList, token);
      return res.status(201).json({ success: true, product: productToInsert });
    }

    // PUT /api/products (Update product)
    if (req.method === 'PUT') {
      const productId = (req.query.id as string) || body?.id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for update' });
      }

      let updatedProduct: any = null;
      const updatedList = products.map((p: any) => {
        if (p.id === productId) {
          updatedProduct = normalizeProduct({ ...p, ...body, id: productId });
          return updatedProduct;
        }
        return p;
      });

      if (!updatedProduct) {
        updatedProduct = normalizeProduct({ ...body, id: productId });
        updatedList.unshift(updatedProduct);
      }

      await persistProducts(updatedList, token);
      return res.status(200).json({ success: true, product: updatedProduct });
    }

    // DELETE /api/products (Delete product)
    if (req.method === 'DELETE') {
      const productId = (req.query.id as string) || body?.id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for deletion' });
      }

      const updatedList = products.filter((p: any) => p.id !== productId);
      await persistProducts(updatedList, token);
      return res.status(200).json({ success: true, message: 'Product deleted successfully', id: productId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: error.message || 'Server database error' });
  }
}
