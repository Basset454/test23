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
  sanitizeEnvironment,
} from './db';

// Ensure environment sanitation on load
sanitizeEnvironment();

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
  } catch {
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
  } catch {
    // ignore
  }
}

function normalizeProduct(raw: any): Product {
  const images = Array.isArray(raw?.images) ? raw.images : [];
  const coverObj = images.find((i: any) => i.isCover) || images[0];
  const coverImageUrl = raw?.coverImageUrl || coverObj?.url || '';

  return {
    id: raw?.id || `prod-f${Date.now()}`,
    name: String(raw?.name || '').trim(),
    price: Number(raw?.price) || 0,
    description: String(raw?.description || '').trim(),
    category: String(raw?.category || 'Living Room').trim(),
    images,
    coverImageUrl,
    isPublished: raw?.isPublished !== undefined ? Boolean(raw.isPublished) : true,
    isFeatured: Boolean(raw?.isFeatured),
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler(req: any, res: any) {
  sanitizeEnvironment();

  // Handle CORS
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Safely extract HTTP method
  const method = (req?.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  // Safely extract query parameters (works for req.query as well as URL string)
  let urlParams: URLSearchParams | null = null;
  try {
    const rawUrl = req?.url || '';
    const parsedUrl = new URL(rawUrl, `http://${req?.headers?.host || 'localhost'}`);
    urlParams = parsedUrl.searchParams;
  } catch {
    // ignore
  }

  const getQueryParam = (name: string): string | undefined => {
    if (req?.query && req.query[name] !== undefined) {
      return String(req.query[name]);
    }
    if (urlParams) {
      const val = urlParams.get(name);
      if (val !== null) return val;
    }
    return undefined;
  };

  const isNeonConfigured = Boolean(getDatabaseUrl());

  try {
    // -------------------------------------------------------------
    // GET /api/products
    // -------------------------------------------------------------
    if (method === 'GET') {
      const includeUnpublished =
        getQueryParam('all') === 'true' ||
        getQueryParam('admin') === 'true';

      if (isNeonConfigured) {
        try {
          const neonProducts = await getNeonProducts(includeUnpublished);
          if (neonProducts !== null) {
            const payload = { products: neonProducts, source: 'neon_postgres' };
            if (typeof res?.status === 'function') return res.status(200).json(payload);
            return new Response(JSON.stringify(payload), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (neonErr: any) {
          console.error('Neon query failure:', neonErr?.message || neonErr);
          const errorPayload = {
            error: 'Failed to fetch products from Neon Postgres database. Please verify database connectivity.',
          };
          if (typeof res?.status === 'function') return res.status(500).json(errorPayload);
          return new Response(JSON.stringify(errorPayload), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Local disk fallback only when no Neon database is configured at all
      const localProducts = loadLocalFileProducts();
      const result = includeUnpublished
        ? localProducts
        : localProducts.filter((p) => p.isPublished !== false);

      const localPayload = { products: result, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(localPayload);
      return new Response(JSON.stringify(localPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Safely parse request body
    let body = req?.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (!body && typeof req?.json === 'function') {
      try {
        body = await req.json();
      } catch {
        // ignore
      }
    }

    // -------------------------------------------------------------
    // POST /api/products (Create new product in Neon Postgres)
    // -------------------------------------------------------------
    if (method === 'POST') {
      if (!body || !body.name) {
        const errPayload = { error: 'Product name is required' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const productToInsert = normalizeProduct(body);

      if (isNeonConfigured) {
        try {
          const inserted = await insertNeonProduct(productToInsert);
          if (inserted) {
            const okPayload = { success: true, product: inserted, source: 'neon_postgres' };
            if (typeof res?.status === 'function') return res.status(201).json(okPayload);
            return new Response(JSON.stringify(okPayload), {
              status: 201,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (neonErr: any) {
          console.error('Neon insert failure:', neonErr?.message || neonErr);
          const errPayload = { error: 'Failed to save product to Neon Postgres database.' };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Local fallback
      const current = loadLocalFileProducts();
      const updatedList = [productToInsert, ...current];
      saveLocalFileProducts(updatedList);
      const localOkPayload = { success: true, product: productToInsert, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(201).json(localOkPayload);
      return new Response(JSON.stringify(localOkPayload), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------------------------------------------------------------
    // PUT /api/products (Update product in Neon Postgres)
    // -------------------------------------------------------------
    if (method === 'PUT') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for update' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (isNeonConfigured) {
        try {
          const updated = await updateNeonProduct(productId, body);
          if (updated) {
            const okPayload = { success: true, product: updated, source: 'neon_postgres' };
            if (typeof res?.status === 'function') return res.status(200).json(okPayload);
            return new Response(JSON.stringify(okPayload), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (neonErr: any) {
          console.error('Neon update failure:', neonErr?.message || neonErr);
          const errPayload = { error: 'Failed to update product in Neon Postgres database.' };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Local fallback
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
      const localOkPayload = { success: true, product: updatedProduct, source: 'local_disk' };
      if (typeof res?.status === 'function') return res.status(200).json(localOkPayload);
      return new Response(JSON.stringify(localOkPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // -------------------------------------------------------------
    // DELETE /api/products (Delete product from Neon Postgres)
    // -------------------------------------------------------------
    if (method === 'DELETE') {
      const productId = getQueryParam('id') || body?.id;
      if (!productId) {
        const errPayload = { error: 'Product ID is required for deletion' };
        if (typeof res?.status === 'function') return res.status(400).json(errPayload);
        return new Response(JSON.stringify(errPayload), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (isNeonConfigured) {
        try {
          await deleteNeonProduct(productId);
          const okPayload = {
            success: true,
            message: 'Product deleted from Neon database successfully',
            id: productId,
            source: 'neon_postgres',
          };
          if (typeof res?.status === 'function') return res.status(200).json(okPayload);
          return new Response(JSON.stringify(okPayload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (neonErr: any) {
          console.error('Neon delete failure:', neonErr?.message || neonErr);
          const errPayload = { error: 'Failed to delete product from Neon Postgres database.' };
          if (typeof res?.status === 'function') return res.status(500).json(errPayload);
          return new Response(JSON.stringify(errPayload), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // Local fallback
      const current = loadLocalFileProducts();
      const updatedList = current.filter((p) => p.id !== productId);
      saveLocalFileProducts(updatedList);
      const localOkPayload = {
        success: true,
        message: 'Product deleted successfully',
        id: productId,
        source: 'local_disk',
      };
      if (typeof res?.status === 'function') return res.status(200).json(localOkPayload);
      return new Response(JSON.stringify(localOkPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const unsuppPayload = { error: 'Method not allowed' };
    if (typeof res?.status === 'function') return res.status(405).json(unsuppPayload);
    return new Response(JSON.stringify(unsuppPayload), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Products API unhandled error:', error?.message || error);
    const fatalPayload = { error: 'Database request failed. Please check server logs.' };
    if (typeof res?.status === 'function') return res.status(500).json(fatalPayload);
    return new Response(JSON.stringify(fatalPayload), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
