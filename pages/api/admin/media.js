import { requireAdminApi } from '../../../lib/adminAuth.js';
import { serveMedia } from '../media.js';
export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  return serveMedia(req, res, true);
}
