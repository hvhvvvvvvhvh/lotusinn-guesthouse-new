import { invalidatePublicContent } from '../../../lib/publicStore.js';
import { filePaths, readJson, writeJson } from '../../../lib/dataStore';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { apiError, invalid } from '../../../lib/validation.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.rooms);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const data = req.body;
    if (!data?.roomsPage || !data.roomDetails || !data.amenitiesPage || !Array.isArray(data.roomsPage.availableRooms) || !Array.isArray(data.roomsPage.masterRooms)) invalid('Invalid rooms data.');
    const slugs = new Set();
    for (const room of data.roomsPage.availableRooms) {
      if (!room || typeof room.title !== 'string' || !room.title.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(room.slug || '') || !Object.hasOwn(data.roomDetails, room.slug)) invalid('Every room needs a title, valid slug and detail page.');
      if (slugs.has(room.slug)) invalid('Room slugs must be unique.');
      slugs.add(room.slug);
    }
    const previous = await readJson(filePaths.rooms);
    await writeJson(filePaths.rooms, req.body);
    await invalidatePublicContent('rooms', res, previous.roomsPage.availableRooms.map(room => `/room/${room.slug}`));
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) { return apiError(res, error, 'Unable to process rooms.'); }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
