import { filePaths, readJson, writeJson } from '../../../lib/dataStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.rooms);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    await writeJson(filePaths.rooms, req.body);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
