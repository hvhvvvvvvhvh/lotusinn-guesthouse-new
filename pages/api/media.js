import { getBlogs, getAuthors } from '../../lib/blogStore';
import { filePaths, readJson } from '../../lib/dataStore.js';
import { imageSlots, withImageDefaults } from '../../lib/imageSlots.js';

// Editors store uploads in JSON. Serve images separately rather than embedding
// megabytes of base64 in page HTML and Next's hydration data.
export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return void res.status(405).end(); }
  try {
    let source;
    if (['site', 'rooms'].includes(req.query.dataset) && typeof req.query.slot === 'string') {
      const dataset = req.query.dataset;
      const data = await readJson(filePaths[dataset]);
      source = imageSlots(dataset === 'site' ? withImageDefaults(data) : {}, dataset === 'rooms' ? data : {}, { includeDerived: true }).find(slot => slot.id === req.query.slot)?.value;
    } else if (typeof req.query.blog === 'string') {
      const blog = (await getBlogs()).find(item => item.id === req.query.blog && item.status === 'Published');
      if (typeof req.query.block === 'string' && /^\d+$/.test(req.query.block)) source = blog?.blocks?.[Number(req.query.block)]?.url;
      else source = blog?.featuredImage;
    } else if (typeof req.query.author === 'string') {
      source = (await getAuthors()).find(item => item.id === req.query.author)?.image;
    }
    const match = typeof source === 'string' && /^data:(image\/(?:png|jpe?g|gif|webp|avif|svg\+xml));base64,([a-z0-9+/=\s]+)$/i.exec(source);
    if (!match) return void res.status(404).end();
    const bytes = Buffer.from(match[2], 'base64');
    res.setHeader('Content-Type', match[1]);
    res.setHeader('Content-Length', bytes.length);
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return void res.status(200).end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    console.error('Unable to load image.', error);
    return void res.status(500).end();
  }
}
