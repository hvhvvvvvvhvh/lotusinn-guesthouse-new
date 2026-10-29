import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { requireAdminApi } from '../../../../lib/adminAuth.js';
import { saveImage } from '../../../../lib/imageStorage.js';

export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!/^image\/(jpeg|png|webp|avif|gif)$/.test(req.headers['content-type'] || '')) return res.status(400).json({ message: 'Choose a JPG, PNG, WebP, AVIF or GIF image.' });
  try {
    let length = 0;
    const chunks = [];
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 3 * 1024 * 1024) return res.status(413).json({ message: 'Choose an image smaller than 3 MB.' });
      chunks.push(chunk);
    }
    let bytes;
    try {
      bytes = await sharp(Buffer.concat(chunks), { limitInputPixels: 40000000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    } catch { return res.status(400).json({ message: 'This image could not be read. Try a different photo.' }); }
    const id = createHash('sha256').update(bytes).digest('hex');
    await saveImage(id, bytes);
    return res.status(201).json({ url: `/api/site-image?id=${id}`, bytes: bytes.length });
  } catch (error) {
    console.error('Unable to store website image.', error);
    return res.status(503).json({ message: 'Image storage is unavailable. Please try again.' });
  }
}
