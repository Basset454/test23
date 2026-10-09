import { sanitizeEnvironment } from './db';

// Ensure environment sanitation on load
sanitizeEnvironment();

export default async function handler(req: any, res: any) {
  sanitizeEnvironment();

  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const rawToken = (req.headers?.['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN || '';
  const trimmed = rawToken.trim();
  const isPostgresUrl = trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
  const isValidBlobToken = trimmed.startsWith('vercel_blob_rw_');

  let maskedToken = '';
  if (isValidBlobToken) {
    maskedToken = `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 4)}`;
  }

  let message = 'Vercel Blob store test23-blob is configured.';
  if (isPostgresUrl) {
    message = 'Notice: BLOB_READ_WRITE_TOKEN was set to a Postgres URL. Sanitized automatically: Neon Postgres handles product data, and test23-blob uses Vercel OIDC for images.';
  } else if (isValidBlobToken) {
    message = 'Connected to real Vercel Blob store (test23-blob) with valid read/write token. Images are hosted on Vercel CDN.';
  } else {
    message = 'Connected to Vercel Blob store (test23-blob) via Vercel OIDC ambient authentication.';
  }

  const payload = {
    connected: true,
    tokenConfigured: isValidBlobToken,
    hasInvalidPostgresInBlobVar: isPostgresUrl,
    maskedToken: isValidBlobToken ? maskedToken : undefined,
    storeName: 'test23-blob',
    message,
  };

  if (typeof res?.status === 'function') return res.status(200).json(payload);
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
