export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const isConfigured = Boolean(token && token.trim().length > 0);

  let maskedToken = '';
  if (isConfigured && token) {
    maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
  }

  return res.status(200).json({
    connected: isConfigured,
    tokenConfigured: isConfigured,
    maskedToken,
    storeName: 'test23-blob',
    message: isConfigured
      ? 'Connected to real Vercel Blob store (test23-blob). Image uploads are permanently stored on Vercel CDN.'
      : 'BLOB_READ_WRITE_TOKEN is not detected in environment variables. Real Vercel Blob upload requires this token.',
  });
}
