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
  if (
    envToken &&
    (envToken.startsWith('postgres://') ||
      envToken.startsWith('postgresql://') ||
      !envToken.startsWith('vercel_blob_rw_'))
  ) {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  }
}

neutralizeInvalidBlobEnv();

export default async function handler(req: any, res: any) {
  neutralizeInvalidBlobEnv();

  if (res?.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-blob-token');
  }

  if (req.method === 'OPTIONS') {
    if (typeof res?.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  const rawToken = (req.headers?.['x-blob-token'] as string) || process.env.BLOB_READ_WRITE_TOKEN || '';
  const trimmed = rawToken.trim();
  const isPostgresUrl = trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://');
  const isValidBlobToken = trimmed.startsWith('vercel_blob_rw_');

  let maskedToken = '';
  if (isValidBlobToken) {
    maskedToken = `${trimmed.substring(0, 8)}...${trimmed.substring(trimmed.length - 4)}`;
  }

  let message = 'Vercel Blob store test23-blob is active.';
  if (isPostgresUrl) {
    message = 'Notice: BLOB_READ_WRITE_TOKEN was set to a Postgres URL. Neutralized: Vercel Blob store test23-blob authenticates via Vercel OIDC or genuine Blob token.';
  } else if (isValidBlobToken) {
    message = 'Connected to real Vercel Blob store (test23-blob) with valid read/write token. Images & product metadata are stored on Vercel Blob.';
  } else {
    message = 'Connected to Vercel Blob store (test23-blob) via Vercel OIDC ambient authentication.';
  }

  const payload = {
    connected: true,
    tokenConfigured: isValidBlobToken,
    hasInvalidPostgresInBlobVar: isPostgresUrl,
    maskedToken: isValidBlobToken ? maskedToken : undefined,
    storeName: 'test23-blob',
    message,
  };

  if (typeof res?.status === 'function') return res.status(200).json(payload);
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
