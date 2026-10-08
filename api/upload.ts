import { put } from '@vercel/blob';

// Disable default Vercel bodyParser so request can be streamed directly to Vercel Blob
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  if (!token || token.trim().length === 0) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN is missing! Please make sure your Vercel Blob store (test23-blob) is connected to the project on Vercel.',
      code: 'MISSING_BLOB_TOKEN',
    });
  }

  try {
    const rawFilename = (req.query.filename as string) || `furniture-${Date.now()}.jpg`;
    // Clean and organize into products folder
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `products/${Date.now()}-${cleanFilename}`;
    const contentType = (req.headers['content-type'] as string) || 'image/jpeg';

    // Stream directly into Vercel Blob
    const blob = await put(pathname, req, {
      access: 'public',
      token: token.trim(),
      contentType,
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
    });
  } catch (error: any) {
    console.error('Real Vercel Blob upload error:', error);
    return res.status(500).json({
      error: `Vercel Blob upload failed: ${error.message || 'Unknown error'}`,
      details: error.toString(),
    });
  }
}
