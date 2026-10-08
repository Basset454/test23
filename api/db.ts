import { neon } from '@neondatabase/serverless';
import { Product, ProductImage } from '../src/types';
import { INITIAL_PRODUCTS } from '../src/data/initialProducts';

let tableInitialized = false;

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );
}

export function getSqlClient() {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
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
            ${JSON.stringify(p.images || [])}::jsonb,
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
      ${JSON.stringify(product.images || [])}::jsonb,
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
      images = ${JSON.stringify(merged.images)}::jsonb,
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
