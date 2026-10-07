import { filePaths, readJson, writeJson } from '../../../lib/dataStore';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.bookings);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const data = await readJson(filePaths.bookings);
    const booking = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
    const nextData = { bookings: [booking, ...(data.bookings || [])] };
    await writeJson(filePaths.bookings, nextData);
    return res.status(200).json({ success: true, booking });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}
