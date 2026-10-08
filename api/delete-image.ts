import { del } from '@vercel/blob';

function sanitizeBlobToken(rawToken?: string): string | undefined {
  if (!rawToken || typeof rawToken !== 'string') return undefined;
  const trimmed = rawToken.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
    return undefined;
  }
  if (!trimmed.startsWith('vercel_blob_rw_')) {
    return undefined;
  }
  return trimmed;
}

function neutralizeInvalidBlobEnv() {
  const envToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (envToken && (envToken.startsWith('postgres://') || envToken.startsWith('postgresql://'))) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  }
}

export default async function handler(req: any, res: any) {
  neutralizeInvalidBlobEnv();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawToken = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const token = sanitizeBlobToken(rawToken);

  try {
    const url = req.body?.url || (req.query?.url as string);
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required for deletion' });
    }

    if (url.includes('blob.vercel-storage.com')) {
      await del(url, { token });
    }

    return res.status(200).json({ success: true, message: 'Image deleted from Vercel Blob', url });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
}
