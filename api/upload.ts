import { put } from '@vercel/blob';
import busboy from 'busboy';

// Disable default Vercel bodyParser so raw stream can be parsed without truncation or corruption
export const config = {
  api: {
    bodyParser: false,
  },
};

function parseNodeMultipart(req: any): Promise<{ buffer: Buffer; filename: string; mimetype: string }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = 'image/jpeg';
    let fileFound = false;

    bb.on('file', (_name: string, fileStream: any, info: any) => {
      fileFound = true;
      filename = info.filename || `upload-${Date.now()}.jpg`;
      mimetype = info.mimeType || 'image/jpeg';
      const chunks: Buffer[] = [];

      fileStream.on('data', (data: Buffer) => chunks.push(data));
      fileStream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', () => {
      if (fileFound && fileBuffer) {
        resolve({ buffer: fileBuffer, filename, mimetype });
      } else {
        reject(new Error('No valid image file found in upload'));
      }
    });

    bb.on('error', (err: any) => reject(err));
    req.pipe(bb);
  });
}

function readNodeStream(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err: any) => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  // CORS headers
  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');
  }

  // Handle Web Standard Request (Edge or Next/Vercel standard)
  if (typeof req?.formData === 'function') {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
      const explicitToken = req.headers.get('x-blob-token') || process.env.BLOB_READ_WRITE_TOKEN;
      const token = explicitToken && explicitToken.trim().length > 0 ? explicitToken.trim() : undefined;

      const form = await req.formData();
      const possibleFile = form.get('file') || form.get('image') || form.get('images');
      if (!(possibleFile instanceof File)) {
        return new Response(JSON.stringify({ error: 'No valid file received from form' }), { status: 400 });
      }

      const cleanFilename = possibleFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const pathname = `products/${Date.now()}-${cleanFilename}`;

      const blob = await put(pathname, possibleFile, {
        access: 'public',
        token,
        contentType: possibleFile.type || 'image/jpeg',
      });

      return new Response(
        JSON.stringify({
          success: true,
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: possibleFile.size,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message || 'Upload failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle Node.js runtime (req: IncomingMessage, res: ServerResponse)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const explicitToken = (req.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  const token = explicitToken && explicitToken.trim().length > 0 ? explicitToken.trim() : undefined;

  try {
    const rawContentType = (req.headers['content-type'] as string) || '';
    let fileBuffer: Buffer;
    let filename: string;
    let contentType: string;

    if (rawContentType.includes('multipart/form-data')) {
      // Extract pure file bytes without multipart headers
      const parsed = await parseNodeMultipart(req);
      fileBuffer = parsed.buffer;
      filename = parsed.filename;
      contentType = parsed.mimetype;
    } else {
      // Raw binary stream (body is pure image file)
      const rawFilename = (req.query?.filename as string) || `furniture-${Date.now()}.jpg`;
      filename = rawFilename;
      contentType = rawContentType || 'image/jpeg';
      fileBuffer = await readNodeStream(req);
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or missing.' });
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `products/${Date.now()}-${cleanFilename}`;

    // Pass the pure Buffer directly to put() - ensuring valid JPEG/PNG signatures
    const blob = await put(pathname, fileBuffer, {
      access: 'public',
      token,
      contentType,
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: blob.contentType,
      size: fileBuffer.length,
    });
  } catch (error: any) {
    console.error('Vercel Blob upload failed:', error);
    return res.status(500).json({
      error: `Vercel Blob upload failed: ${error.message || 'Unknown Blob error'}.`,
      details: error.toString(),
    });
  }
}
