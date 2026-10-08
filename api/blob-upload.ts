import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export default async function handler(request: any, response: any) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const token = (request.headers['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    return response.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN is missing! Please attach test23-blob store in your Vercel project.',
    });
  }

  try {
    const body = (request.body || {}) as HandleUploadBody;

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
      onUploadCompleted: async () => {
        // Notification on upload completion
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error('Error in blob-upload handler:', error);
    return response.status(400).json({ error: error.message || 'Client upload token generation failed' });
  }
}
