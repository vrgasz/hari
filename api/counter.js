import { kv } from '@vercel/kv';
import { getCookies, readJsonBody, sendJson } from './_utils.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const counterId = (url.searchParams.get('id') || 'default').trim() || 'default';

  if (req.method === 'GET') {
    try {
      const startTime = await kv.get(`counter:${counterId}:startTime`);
      return sendJson(res, 200, { counterId, startTime: startTime ?? null });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, { error: 'Gagal membaca data counter' });
    }
  }

  if (req.method === 'POST') {
    const cookies = getCookies(req);
    if (cookies.admin !== '1') {
      return sendJson(res, 401, { error: 'Admin only' });
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      return sendJson(res, 400, { error: 'Body tidak valid' });
    }

    const { action, startTime } = body || {};

    try {
      if (action === 'startNow') {
        const now = Date.now();
        await kv.set(`counter:${counterId}:startTime`, now);
        return sendJson(res, 200, { message: 'Started now', startTime: now });
      }

      if (action === 'setStart') {
        if (typeof startTime !== 'number') {
          return sendJson(res, 400, { error: 'startTime harus number (timestamp ms)' });
        }
        await kv.set(`counter:${counterId}:startTime`, startTime);
        return sendJson(res, 200, { message: 'Start time updated', startTime });
      }

      if (action === 'reset') {
        await kv.del(`counter:${counterId}:startTime`);
        return sendJson(res, 200, { message: 'Reset OK' });
      }

      return sendJson(res, 400, { error: 'Action tidak dikenal' });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, { error: 'Gagal update counter' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return sendJson(res, 405, { error: 'Method not allowed' });
}
