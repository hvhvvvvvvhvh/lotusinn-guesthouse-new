import { requireAdminApi } from '../../../lib/adminAuth.js';
import { getAdminPageData } from '../../../lib/adminPageData.js';
import { apiError } from '../../../lib/validation.js';

// One data function serves every admin screen, so navigating sections reuses its warm instance.
export default async function handler(req, res) {
  const started = performance.now();
  if (!await requireAdminApi(req, res)) return;
  const authenticated = performance.now();
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  try {
    const path = typeof req.query.path === 'string' ? req.query.path : '';
    const props = await getAdminPageData(path, req.query);
    const finished = performance.now();
    res.setHeader('Server-Timing', `auth;dur=${(authenticated - started).toFixed(1)},data;dur=${(finished - authenticated).toFixed(1)},total;dur=${(finished - started).toFixed(1)}`);
    return res.status(200).json(props);
  } catch (error) { return apiError(res, error, 'Unable to load this admin page.'); }
}
