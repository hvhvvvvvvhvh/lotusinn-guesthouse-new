import { invalidatePublicContent } from '../../../lib/publicStore.js';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { getAuthors, makeId, slugify } from '../../../lib/blogStore';
import { getRecord, mutateRecord } from '../../../lib/recordStore.js';
import { text, invalid, apiError } from '../../../lib/validation.js';
import { contentFields, safeUrl } from '../../../lib/contentValidation.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ authors: await getAuthors() });
    if (req.method === 'POST') {
      const body = req.body || {};
      const name = text(body.name, 'Author name', { required: true, max: 150 });
      const slug = slugify(text(body.slug, 'Slug') || name);
      if (!slug) invalid('A valid author slug is required.');
      const id = text(body.id, 'Author id') || makeId('author');
      const fields = contentFields(body, ['role', 'email', 'shortBio', 'biography', 'image', 'linkedin', 'seoTitle', 'seoDescription']);
      if (fields.image && !safeUrl(fields.image, true)) invalid('Use a valid profile image URL.');
      if (fields.linkedin && !/^https?:\/\//i.test(fields.linkedin)) invalid('Use an HTTP LinkedIn URL.');
      const expertise = Array.isArray(body.expertise) ? body.expertise.map(item => text(item, 'Expertise')) : [];
      const result = await mutateRecord('authors', id, 'upsert', { ...fields, id, name, slug, expertise, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await invalidatePublicContent('authors', res, [result.previous, result.record]);
      return res.status(200).json({ success: true, author: result.record });
    }
    if (req.method === 'DELETE') {
      const id = text(req.body?.id || req.query?.id, 'Author id', { required: true });
      const result = await mutateRecord('authors', id, 'delete');
      await invalidatePublicContent('authors', res, [result.previous]);
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return apiError(res, error, 'Unable to process author request.'); }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
