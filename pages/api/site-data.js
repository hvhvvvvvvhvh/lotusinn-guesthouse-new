import { readPublicJson } from '../../lib/publicStore.js';
import { publicDataset } from '../../lib/publicDataset.js';
import { withImageDefaults } from '../../lib/imageSlots.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const dataset = req.query.dataset;
  if (!['site', 'rooms'].includes(dataset)) return res.status(400).json({ message: 'Unknown public dataset.' });
  try {
    const data = await readPublicJson(dataset);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30, stale-while-revalidate=30');
    return res.status(200).json(publicDataset(dataset === 'site' ? withImageDefaults(data) : data, dataset));
  }
  catch (error) { console.error('Unable to load public site data.', error); return res.status(503).json({ message: 'Website content is temporarily unavailable.' }); }
}
