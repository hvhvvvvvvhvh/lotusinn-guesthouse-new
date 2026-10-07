import { filePaths, readJson, writeJson } from '../../../lib/dataStore';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const data = await readJson(filePaths.expenses);
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const expenses = req.body.expenses || [];
      await writeJson(filePaths.expenses, { expenses });
      return res.status(200).json({ success: true, expenses });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to process expenses',
      error: error.message,
    });
  }
}