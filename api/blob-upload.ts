import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(request: any, response: any) {
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
  let token = explicitToken && explicitToken.trim().length > 0 ? explicitToken.trim() : undefined;

  try {
    const body = (request.body || {}) as HandleUploadBody;

    // Check if client provided custom token payload
    if (!token && body?.payload && typeof body.payload === 'object') {
      try {
        const clientPayloadStr = (body.payload as any).clientPayload;
        if (clientPayloadStr) {
          const parsed = JSON.parse(clientPayloadStr);
          if (parsed?.token) {
            token = parsed.token;
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
