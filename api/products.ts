import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

const INITIAL_FALLBACK_PRODUCTS = [
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

// In-memory cache for fast response within serverless execution
let memoryProductsCache: any[] | null = null;

async function loadProducts(token?: string): Promise<any[]> {
  if (memoryProductsCache && memoryProductsCache.length > 0) {
    return memoryProductsCache;
  }

  // 1. Try reading from local disk (if running with filesystem access)
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
    // Filesystem may be read-only in some Vercel lambda environments
  }

  // 2. Try reading from Vercel Blob persistent database if token is available
  if (token) {
    try {
      // Find blob URL for _database/products.json if available
      const dbUrl = `https://blob.vercel-storage.com/_database/products.json`;
      const res = await fetch(dbUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          memoryProductsCache = data;
          return data;
        }
      }
    } catch {
      // fallback
    }
  }

  memoryProductsCache = INITIAL_FALLBACK_PRODUCTS;
  return INITIAL_FALLBACK_PRODUCTS;
}

async function persistProducts(products: any[], token?: string) {
  memoryProductsCache = products;

  // 1. Save to local disk if writable
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch {
    // Filesystem might be read-only in serverless
  }

  // 2. Save persistently to Vercel Blob store if token is available
  if (token) {
    try {
      await put('_database/products.json', JSON.stringify(products), {
        access: 'public',
        token,
        addRandomSuffix: false,
        contentType: 'application/json',
      });
    } catch (blobSaveErr) {
      console.warn('Could not save database backup to Blob:', blobSaveErr);
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const products = await loadProducts(token);

    // GET /api/products
    if (req.method === 'GET') {
      const includeUnpublished = req.query.all === 'true' || req.query.admin === 'true';
      const result = includeUnpublished ? products : products.filter((p: any) => p.isPublished !== false);
      return res.status(200).json({ products: result });
    }

    // Parse body for mutations if needed
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
      const newProduct = body;
      if (!newProduct || !newProduct.name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const productToInsert = {
        ...newProduct,
        id: newProduct.id || `prod-${Date.now()}`,
        createdAt: newProduct.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = [productToInsert, ...products];
      await persistProducts(updatedList, token);
      return res.status(201).json({ success: true, product: productToInsert });
    }

    // PUT /api/products (Update product)
    if (req.method === 'PUT') {
      const updatedProduct = body;
      const productId = (req.query.id as string) || updatedProduct?.id;

      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for update' });
      }

      let found = false;
      const updatedList = products.map((p: any) => {
        if (p.id === productId) {
          found = true;
          return { ...p, ...updatedProduct, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      if (!found) {
        // If not found, append
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
