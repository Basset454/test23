import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

export interface ProductImage {
  id: string;
  url: string;
  pathname?: string;
  isCover: boolean;
  name?: string;
  size?: number;
  uploadedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  images: ProductImage[];
  coverImageUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-f1',
    name: 'Nordic Oak Lounge Chair',
    description: 'Handcrafted solid oak armchair upholstered with premium textured linen. Features ergonomic curved backrest and tapered wooden legs.',
    price: 480,
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
      },
      {
        id: 'img-f1-2',
        url: 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?w=1000&auto=format&fit=crop&q=80',
        name: 'nordic_chair_detail.jpg',
        isCover: false,
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
    description: 'Deep-seat modular 3-piece sectional sofa covered in ivory bouclé fabric. High-density foam core with feather blend topper for ultimate comfort.',
    price: 1650,
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
  },
  {
    id: 'prod-f4',
    name: 'Architect Ergonomic Desk',
    description: 'Sleek workspace desk made of solid ash wood with integrated wire management channel, subtle brass accents, and dual soft-close drawers.',
    price: 680,
    category: 'Office',
    isPublished: true,
    isFeatured: false,
    coverImageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
    images: [
      {
        id: 'img-f4-1',
        url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
        name: 'architect_desk.jpg',
        isCover: true,
        uploadedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

let tableInitialized = false;

/**
 * Sanitizes environment variables:
 * - If BLOB_READ_WRITE_TOKEN mistakenly contains a Postgres connection string,
 *   we recover it into POSTGRES_URL / DATABASE_URL and delete it from BLOB_READ_WRITE_TOKEN.
 * - This prevents @vercel/blob from crashing due to an invalid token format.
 */
export function sanitizeEnvironment() {
  const blobVar = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobVar && typeof blobVar === 'string') {
    const trimmed = blobVar.trim().replace(/^['"]|['"]$/g, '');
    if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
      if (!process.env.POSTGRES_URL) {
        process.env.POSTGRES_URL = trimmed;
      }
      if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = trimmed;
      }
      delete process.env.BLOB_READ_WRITE_TOKEN;
    }
  }
}

// Run immediately upon module load
sanitizeEnvironment();

/**
 * Returns a valid Neon PostgreSQL connection string.
 * Strictly verifies that the URL starts with postgres:// or postgresql://.
 */
export function getDatabaseUrl(): string | undefined {
  sanitizeEnvironment();

  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const direct of candidates) {
    if (direct && typeof direct === 'string') {
      const trimmed = direct.trim().replace(/^['"]|['"]$/g, '');
      if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
        return trimmed;
      }
    }
  }

  return undefined;
}

let cachedSql: any = null;

export function getSqlClient() {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!cachedSql) {
    cachedSql = neon(url);
  }
  return cachedSql;
}

export function mapRowToProduct(row: any): Product {
  let images: ProductImage[] = [];
  if (Array.isArray(row.images)) {
    images = row.images;
  } else if (typeof row.images === 'string') {
    try {
      images = JSON.parse(row.images);
    } catch {
      images = [];
    }
  }

  const coverObj = images.find((i) => i.isCover) || images[0];
  const coverImageUrl = row.cover_image_url || row.coverImageUrl || coverObj?.url || '';

  return {
    id: String(row.id),
    name: String(row.name || ''),
    price: Number(row.price) || 0,
    description: String(row.description || ''),
    category: String(row.category || 'Living Room'),
    images,
    coverImageUrl,
    isPublished: row.is_published !== undefined ? Boolean(row.is_published) : Boolean(row.isPublished ?? true),
    isFeatured: row.is_featured !== undefined ? Boolean(row.is_featured) : Boolean(row.isFeatured ?? false),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function initProductsTable(sql: any) {
  if (tableInitialized) return;

  try {
    // 1. Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'Living Room',
        images JSONB DEFAULT '[]'::jsonb,
        cover_image_url TEXT DEFAULT '',
        is_published BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // 2. Check if table is empty and seed initial sample furniture products
    const countResult = await sql`SELECT COUNT(*)::int as count FROM products;`;
    const count = countResult[0]?.count || 0;

    if (count === 0 && INITIAL_PRODUCTS.length > 0) {
      for (const p of INITIAL_PRODUCTS) {
        await sql`
          INSERT INTO products (
            id, name, price, description, category, images, cover_image_url, is_published, is_featured, created_at, updated_at
          ) VALUES (
            ${p.id},
            ${p.name},
            ${p.price},
            ${p.description || ''},
            ${p.category || 'Living Room'},
            ${JSON.stringify(p.images || [])},
            ${p.coverImageUrl || ''},
            ${p.isPublished !== false},
            ${Boolean(p.isFeatured)},
            ${p.createdAt || new Date().toISOString()},
            ${p.updatedAt || new Date().toISOString()}
          )
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }

    tableInitialized = true;
  } catch (err) {
    console.error('Error initializing products table in Neon Postgres:', err);
    throw err;
  }
}

export async function getNeonProducts(includeUnpublished = false): Promise<Product[] | null> {
  const sql = getSqlClient();
  if (!sql) return null;

  await initProductsTable(sql);

  let rows: any[];
  if (includeUnpublished) {
    rows = await sql`SELECT * FROM products ORDER BY created_at DESC;`;
  } else {
    rows = await sql`SELECT * FROM products WHERE is_published = true ORDER BY created_at DESC;`;
  }

  return rows.map(mapRowToProduct);
}

export async function insertNeonProduct(product: Product): Promise<Product | null> {
  const sql = getSqlClient();
  if (!sql) return null;

  await initProductsTable(sql);

  const rows = await sql`
    INSERT INTO products (
      id, name, price, description, category, images, cover_image_url, is_published, is_featured, created_at, updated_at
    ) VALUES (
      ${product.id},
      ${product.name},
      ${product.price},
      ${product.description || ''},
      ${product.category || 'Living Room'},
      ${JSON.stringify(product.images || [])},
      ${product.coverImageUrl || ''},
      ${product.isPublished !== false},
      ${Boolean(product.isFeatured)},
      ${product.createdAt || new Date().toISOString()},
      ${product.updatedAt || new Date().toISOString()}
    )
    RETURNING *;
  `;

  if (rows && rows.length > 0) {
    return mapRowToProduct(rows[0]);
  }
  return null;
}

export async function updateNeonProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const sql = getSqlClient();
  if (!sql) return null;

  await initProductsTable(sql);

  const existingRows = await sql`SELECT * FROM products WHERE id = ${id};`;
  if (!existingRows || existingRows.length === 0) {
    return null;
  }

  const existing = mapRowToProduct(existingRows[0]);
  const merged: Product = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  const rows = await sql`
    UPDATE products SET
      name = ${merged.name},
      price = ${merged.price},
      description = ${merged.description},
      category = ${merged.category},
      images = ${JSON.stringify(merged.images || [])},
      cover_image_url = ${merged.coverImageUrl},
      is_published = ${merged.isPublished},
      is_featured = ${merged.isFeatured},
      updated_at = ${merged.updatedAt}
    WHERE id = ${id}
    RETURNING *;
  `;

  if (rows && rows.length > 0) {
    return mapRowToProduct(rows[0]);
  }
  return null;
}

export async function deleteNeonProduct(id: string): Promise<boolean | null> {
  const sql = getSqlClient();
  if (!sql) return null;

  await initProductsTable(sql);

  await sql`DELETE FROM products WHERE id = ${id};`;
  return true;
}

/**
 * Default export handler for /api/db endpoint.
 * Acts as a health-check and diagnostics endpoint without revealing secrets.
 */
export default async function handler(req: any, res: any) {
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const dbConfigured = Boolean(getDatabaseUrl());
  if (!dbConfigured) {
    const errorBody = {
      status: 'error',
      database: 'neon_postgres',
      connected: false,
      message: 'POSTGRES_URL environment variable is not configured.',
    };
    if (typeof res?.status === 'function') return res.status(503).json(errorBody);
    return new Response(JSON.stringify(errorBody), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const sql = getSqlClient();
    const testResult = await sql`SELECT 1 as connected, current_database() as db_name;`;
    const countResult = await sql`SELECT COUNT(*)::int as count FROM products;`;
    const count = countResult[0]?.count || 0;

    const data = {
      status: 'healthy',
      database: 'neon_postgres',
      connected: Boolean(testResult[0]?.connected),
      productCount: count,
      timestamp: new Date().toISOString(),
    };

    if (typeof res?.status === 'function') return res.status(200).json(data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    const errorBody = {
      status: 'error',
      database: 'neon_postgres',
      connected: false,
      message: 'Failed to connect to Neon Postgres database.',
      details: err.message || 'Unknown database error',
    };
    if (typeof res?.status === 'function') return res.status(500).json(errorBody);
    return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
