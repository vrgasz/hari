import { sendJson } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';

  res.setHeader(
    'Set-Cookie',
    `admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;${secure}`
  );

  return sendJson(res, 200, { ok: true, message: 'Logout berhasil' });
}
