import fs from 'fs';
import path from 'path';
import {
  Product,
  INITIAL_PRODUCTS,
  getDatabaseUrl,
  getNeonProducts,
  insertNeonProduct,
  updateNeonProduct,
  deleteNeonProduct,
} from './db';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

// Local file helper for development fallback only (when Neon connection string is not set)
function loadLocalFileProducts(): Product[] {
  try {
    if (fs.existsSync(LOCAL_PRODUCTS_FILE)) {
      const data = fs.readFileSync(LOCAL_PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return INITIAL_PRODUCTS;
}

function saveLocalFileProducts(products: Product[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function normalizeProduct(raw: any): Product {
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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isNeonConfigured = Boolean(getDatabaseUrl());

  try {
    // -------------------------------------------------------------
    // GET /api/products
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const includeUnpublished = req.query.all === 'true' || req.query.admin === 'true';

      if (isNeonConfigured) {
        try {
          const neonProducts = await getNeonProducts(includeUnpublished);
          if (neonProducts !== null) {
            return res.status(200).json({ products: neonProducts, source: 'neon_postgres' });
          }
        } catch (neonErr: any) {
          console.error('Neon query failure:', neonErr.message || neonErr);
          // Return safe diagnostic error without exposing connection secrets
          return res.status(500).json({
            error: 'Failed to fetch products from Neon Postgres database. Please verify database connectivity.',
          });
        }
      }

      // Local dev fallback only when no database URL is configured
      const localProducts = loadLocalFileProducts();
      const result = includeUnpublished
        ? localProducts
        : localProducts.filter((p) => p.isPublished !== false);
      return res.status(200).json({ products: result, source: 'local_disk' });
    }

    // Parse body for mutations
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    }

    // -------------------------------------------------------------
    // POST /api/products (Create new product in Neon Postgres)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      if (!body || !body.name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      const productToInsert = normalizeProduct(body);

      if (isNeonConfigured) {
        try {
          const inserted = await insertNeonProduct(productToInsert);
          if (inserted) {
            return res.status(201).json({ success: true, product: inserted, source: 'neon_postgres' });
          }
        } catch (neonErr: any) {
          console.error('Neon insert failure:', neonErr.message || neonErr);
          return res.status(500).json({
            error: 'Failed to save product to Neon Postgres database.',
          });
        }
      }

      // Local dev fallback
      const current = loadLocalFileProducts();
      const updatedList = [productToInsert, ...current];
      saveLocalFileProducts(updatedList);
      return res.status(201).json({ success: true, product: productToInsert, source: 'local_disk' });
    }

    // -------------------------------------------------------------
    // PUT /api/products (Update product in Neon Postgres)
    // -------------------------------------------------------------
    if (req.method === 'PUT') {
      const productId = (req.query.id as string) || body?.id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for update' });
      }

      if (isNeonConfigured) {
        try {
          const updated = await updateNeonProduct(productId, body);
          if (updated) {
            return res.status(200).json({ success: true, product: updated, source: 'neon_postgres' });
          }
        } catch (neonErr: any) {
          console.error('Neon update failure:', neonErr.message || neonErr);
          return res.status(500).json({
            error: 'Failed to update product in Neon Postgres database.',
          });
        }
      }

      // Local dev fallback
      const current = loadLocalFileProducts();
      let updatedProduct: Product | null = null;
      const updatedList = current.map((p) => {
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

      saveLocalFileProducts(updatedList);
      return res.status(200).json({ success: true, product: updatedProduct, source: 'local_disk' });
    }

    // -------------------------------------------------------------
    // DELETE /api/products (Delete product from Neon Postgres)
    // -------------------------------------------------------------
    if (req.method === 'DELETE') {
      const productId = (req.query.id as string) || body?.id;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required for deletion' });
      }

      if (isNeonConfigured) {
        try {
          await deleteNeonProduct(productId);
          return res.status(200).json({
            success: true,
            message: 'Product deleted from Neon database successfully',
            id: productId,
            source: 'neon_postgres',
          });
        } catch (neonErr: any) {
          console.error('Neon delete failure:', neonErr.message || neonErr);
          return res.status(500).json({
            error: 'Failed to delete product from Neon Postgres database.',
          });
        }
      }

      // Local dev fallback
      const current = loadLocalFileProducts();
      const updatedList = current.filter((p) => p.id !== productId);
      saveLocalFileProducts(updatedList);
      return res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
        id: productId,
        source: 'local_disk',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Products API unhandled error:', error?.message || error);
    return res.status(500).json({ error: 'Database request failed. Please check server logs.' });
  }
}
