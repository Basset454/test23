import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
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

export default async function handler(request: any, response: any) {
  sanitizeEnvironment();

  if (response?.setHeader) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');
  }

  if (request.method === 'OPTIONS') {
    if (typeof response?.status === 'function') return response.status(200).end();
    return new Response(null, { status: 200 });
  }

  if (request.method !== 'POST') {
    if (typeof response?.status === 'function') return response.status(405).json({ error: 'Method not allowed' });
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const explicitToken = (request.headers?.['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  let token = sanitizeBlobToken(explicitToken);

  try {
    let body: HandleUploadBody = request.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (!body && typeof request.json === 'function') {
      try {
        body = await request.json();
      } catch {
        // ignore
      }
    }

    // Check if client provided custom token payload
    if (!token && body?.payload && typeof body.payload === 'object') {
      try {
        const clientPayloadStr = (body.payload as any).clientPayload;
        if (clientPayloadStr) {
          const parsed = JSON.parse(clientPayloadStr);
          if (parsed?.token) {
            token = sanitizeBlobToken(parsed.token);
          }
        }
      } catch {
        // ignore
      }
    }

    const uploadOptions: Record<string, any> = {
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {},
    };

    if (token) {
      uploadOptions.token = token;
    }

    const jsonResponse = await handleUpload(uploadOptions as any);

    if (typeof response?.status === 'function') return response.status(200).json(jsonResponse);
    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in blob-upload handler:', error);
    const errBody = {
      error: `Client upload token generation failed: ${error.message || 'Unknown error'}. Ensure test23-blob is attached to the Vercel project.`,
    };
    if (typeof response?.status === 'function') return response.status(400).json(errBody);
    return new Response(JSON.stringify(errBody), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
