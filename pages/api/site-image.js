import { loadImage, saveImage } from '../../lib/imageStorage.js';
import sharp from 'sharp';
export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  if (typeof req.query.id !== 'string' || !/^[a-f0-9]{64}$/.test(req.query.id)) return res.status(404).end();
  const width = req.query.w ? Number(req.query.w) : null;
  if (req.query.w && ![480, 960, 1600].includes(width)) return res.status(400).end();
  try {
    let bytes = await loadImage(req.query.id, width && width !== 1600 ? width : undefined);
    if (!bytes && width && width !== 1600) {
      const original = await loadImage(req.query.id);
      if (original) {
        bytes = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        await saveImage(req.query.id, bytes, width);
      }
    }
    if (!bytes) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', bytes.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).end(req.method === 'HEAD' ? undefined : bytes);
  } catch { return res.status(503).end(); }
}
