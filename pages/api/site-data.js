import { filePaths, readJson } from '../../lib/dataStore';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ message: 'Method not allowed.' }); }
  const dataset = req.query.dataset;
  if (!['site', 'rooms'].includes(dataset)) return res.status(400).json({ message: 'Unknown public dataset.' });
  try { return res.status(200).json(await readJson(filePaths[dataset])); }
  catch (error) { console.error('Unable to load public site data.', error); return res.status(503).json({ message: 'Website content is temporarily unavailable.' }); }
}
