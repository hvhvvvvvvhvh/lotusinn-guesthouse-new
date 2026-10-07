import { filePaths, readJson, writeJson } from '../../../lib/dataStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.messages);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const data = await readJson(filePaths.messages);
    const message = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
    const nextData = { messages: [message, ...(data.messages || [])] };
    await writeJson(filePaths.messages, nextData);
    return res.status(200).json({ success: true, message });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
