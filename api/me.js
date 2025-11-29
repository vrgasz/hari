import { getCookies, sendJson } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const cookies = getCookies(req);
  const isAdmin = cookies.admin === '1';
  return sendJson(res, 200, { isAdmin });
}
