import { requireAdminApi } from '../../../../lib/adminAuth.js';
import { filePaths, readJson, updateJson } from '../../../../lib/dataStore.js';
import { imageSlots, setImageSlot, withImageDefaults } from '../../../../lib/imageSlots.js';
import { apiError, invalid } from '../../../../lib/validation.js';
import { adminImageSlots, imageHash } from '../../../../lib/adminImageSlots.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
    const [rawSite, rooms] = await Promise.all([readJson(filePaths.site), readJson(filePaths.rooms)]);
    const site = withImageDefaults(rawSite);
    const slots = imageSlots(site, rooms);
    if (req.method === 'GET') return res.status(200).json({ slots: adminImageSlots(slots) });
    if (req.method !== 'PATCH') { res.setHeader('Allow', 'GET, PATCH'); return res.status(405).json({ message: 'Method not allowed.' }); }
    const slot = slots.find(item => item.id === req.body?.id);
    if (!slot) invalid('This image location does not exist. Refresh the page.');
    const value = req.body.value;
    if (typeof value !== 'string' || value.length > 2048 || !value.trim()) invalid('Enter an image URL or upload a photo.');
    if (!/^\/(?!\/)[^\s\\<>"']+$/.test(value)) {
      let url; try { url = new URL(value); } catch { invalid('Use a website image path or an HTTPS image URL.'); }
      if (url.protocol !== 'https:' || url.username || url.password) invalid('Use an HTTPS image URL without credentials.');
    }
    await updateJson(filePaths[slot.dataset], current => {
      const document = slot.dataset === 'site' ? withImageDefaults(current) : current;
      const latest = imageSlots(slot.dataset === 'site' ? document : site, slot.dataset === 'rooms' ? document : rooms).find(item => item.id === slot.id);
      if (!latest) invalid('Image location changed. Refresh the page.');
      if (typeof req.body.expectedHash === 'string' && imageHash(latest.value) !== req.body.expectedHash) {
        const error = new Error('This image was changed in another session. Refresh before saving.'); error.status = 409; throw error;
      }
      return setImageSlot(document, slot.path, value);
    });
    return res.status(200).json({ success: true, value, expectedHash: imageHash(value) });
  } catch (error) { return apiError(res, error, 'Unable to update website images.'); }
}
