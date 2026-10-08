import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

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

export default async function handler(request: any, response: any) {
  neutralizeInvalidBlobEnv();

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const explicitToken = (request.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;
  let token = sanitizeBlobToken(explicitToken);

  try {
    const body = (request.body || {}) as HandleUploadBody;

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
      } catch {}
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return response.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error('Error in blob-upload handler:', error);
    return response.status(400).json({
      error: `Client upload token generation failed: ${error.message || 'Unknown error'}. Ensure test23-blob is attached to the Vercel project.`,
    });
  }
}
