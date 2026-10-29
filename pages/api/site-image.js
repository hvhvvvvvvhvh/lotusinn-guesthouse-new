import { loadImage } from '../../lib/imageStorage.js';
export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  if (typeof req.query.id !== 'string' || !/^[a-f0-9]{64}$/.test(req.query.id)) return res.status(404).end();
  try {
    const bytes = await loadImage(req.query.id);
    if (!bytes) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', bytes.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).end(req.method === 'HEAD' ? undefined : bytes);
  } catch { return res.status(503).end(); }
}
