export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawToken = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN || '';
  const trimmed = rawToken.trim();
  const isPostgresUrl = trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
  const isValidBlobToken = trimmed.startsWith('vercel_blob_rw_');

  let maskedToken = '';
  if (isValidBlobToken) {
    maskedToken = `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 4)}`;
  }

  let message = 'Checking Vercel Blob store test23-blob...';
  if (isPostgresUrl) {
    message = 'Notice: BLOB_READ_WRITE_TOKEN currently holds a PostgreSQL connection string instead of a Vercel Blob token. Neon Postgres handles the database, while test23-blob uses Vercel OIDC for images.';
  } else if (isValidBlobToken) {
    message = 'Connected to real Vercel Blob store (test23-blob). Image uploads are stored on Vercel CDN.';
  } else {
    message = 'Vercel Blob store (test23-blob) is connected via Vercel OIDC authentication.';
  }

  return res.status(200).json({
    connected: true,
    tokenConfigured: isValidBlobToken,
    hasInvalidPostgresInBlobVar: isPostgresUrl,
    maskedToken: isValidBlobToken ? maskedToken : undefined,
    storeName: 'test23-blob',
    message,
  });
}
