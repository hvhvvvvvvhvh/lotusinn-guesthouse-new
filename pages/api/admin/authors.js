import { requireAdminApi } from '../../../lib/adminAuth.js';
import { getAuthors, makeId, slugify } from '../../../lib/blogStore';
import { filePaths, updateJson } from '../../../lib/dataStore.js';
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
      const data = await updateJson(filePaths.authors, data => {
        const authors = data?.authors || [];
        if (authors.some(item => item.slug === slug && item.id !== id)) throw Object.assign(new Error('That author slug is already in use.'), { status: 409 });
        const current = authors.find(item => item.id === id);
        const author = { ...fields, id, name, slug, expertise, createdAt: current?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        return { authors: current ? authors.map(item => item.id === id ? author : item) : [author, ...authors] };
      });
      return res.status(200).json({ success: true, author: data.authors.find(item => item.id === id) });
    }
    if (req.method === 'DELETE') {
      const id = text(req.body?.id || req.query?.id, 'Author id', { required: true });
      // Existing articles retain their attribution ID and use the public team fallback.
      const data = await updateJson(filePaths.authors, data => ({ authors: (data?.authors || []).filter(item => item.id !== id) }));
      return res.status(200).json({ success: true, authors: data.authors });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return apiError(res, error, 'Unable to process author request.'); }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
