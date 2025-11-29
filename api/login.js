import { readJsonBody, sendJson } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: 'Body tidak valid' });
  }

  const { username, password } = body || {};

  if (!username || !password) {
    return sendJson(res, 400, { error: 'Username & password wajib diisi' });
  }

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const oneWeek = 60 * 60 * 24 * 7;
    const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';

    res.setHeader(
      'Set-Cookie',
      `admin=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${oneWeek};${secure}`
    );

    return sendJson(res, 200, { ok: true, message: 'Login berhasil' });
  }

  return sendJson(res, 401, { error: 'Username atau password salah' });
}
