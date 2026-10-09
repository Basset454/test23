import { del } from '@vercel/blob';
import { sanitizeEnvironment } from './db';

// Ensure environment sanitation on load
sanitizeEnvironment();

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

export default async function handler(req: any, res: any) {
  sanitizeEnvironment();

  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const rawToken = (req.headers?.['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const token = sanitizeBlobToken(rawToken);

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (!body && typeof req.json === 'function') {
      try {
        body = await req.json();
      } catch {
        // ignore
      }
    }

    const url = body?.url || (req.query?.url as string);
    if (!url) {
      const errBody = { error: 'Image URL is required for deletion' };
      if (typeof res?.status === 'function') return res.status(400).json(errBody);
      return new Response(JSON.stringify(errBody), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('blob.vercel-storage.com')) {
      const delOptions: Record<string, any> = {};
      if (token) {
        delOptions.token = token;
      }
      await del(url, delOptions);
    }

    const okBody = { success: true, message: 'Image deleted from Vercel Blob', url };
    if (typeof res?.status === 'function') return res.status(200).json(okBody);
    return new Response(JSON.stringify(okBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Delete image error:', error);
    const errBody = { error: error.message || 'Failed to delete image' };
    if (typeof res?.status === 'function') return res.status(500).json(errBody);
    return new Response(JSON.stringify(errBody), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
