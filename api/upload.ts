import type { Request, Response } from 'express';
import { put } from '@vercel/blob';

// Vercel Serverless Function handler for /api/upload
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = (req.query.filename as string) || `products/${Date.now()}.png`;
    const token = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN is missing in environment variables. Please add it in your Vercel Project Settings.',
      });
    }

    const blob = await put(filename, req.body, {
      access: 'public',
      token,
      contentType: (req.headers['content-type'] as string) || 'image/jpeg',
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
