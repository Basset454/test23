import { del } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  try {
    const url = req.body?.url || (req.query?.url as string);
    if (!url) {
      return res.status(400).json({ error: 'Image URL is required for deletion' });
    }

    if (url.includes('blob.vercel-storage.com')) {
      if (token) {
        await del(url, { token: token.trim() });
      }
    }

    return res.status(200).json({ success: true, message: 'Image deleted from Vercel Blob', url });
  } catch (error: any) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete image' });
  }
}
