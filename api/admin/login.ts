export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // ignore
    }
  }

  const { password } = body || {};
  const serverPassword = process.env.ADMIN_PASSWORD || 'trust2026';

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (password === serverPassword) {
    const sessionToken = `trust_sess_${Buffer.from(Date.now().toString()).toString('base64')}_${Math.random().toString(36).slice(2, 10)}`;
    return res.status(200).json({
      success: true,
      token: sessionToken,
      message: 'Authenticated successfully',
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid admin password',
  });
}
