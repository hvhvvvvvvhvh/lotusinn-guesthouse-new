import { filePaths, readJson } from '../../../lib/dataStore.js';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { createMessage } from '../../../lib/guestRequests.js';
import { apiError } from '../../../lib/validation.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.messages);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    return res.status(201).json({ success: true, message: await createMessage(req.body) });
  }
  return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) { return apiError(res, error, 'Unable to process message request.'); }
}
