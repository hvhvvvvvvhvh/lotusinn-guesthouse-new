import { invalidatePublicContent } from '../../../lib/publicStore.js';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { getBlogs, makeId, slugify } from '../../../lib/blogStore';
import { getRecord, mutateRecord } from '../../../lib/recordStore.js';
import { text, invalid, apiError } from '../../../lib/validation.js';
import { contentFields, safeUrl, validateBlocks, publishFields } from '../../../lib/contentValidation.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
    if (req.method === 'GET') return res.status(200).json({ blogs: await getBlogs() });
    if (req.method === 'POST') {
      const body = req.body || {};
      const title = text(body.title, 'Blog title', { required: true, max: 300 });
      const slug = slugify(text(body.slug, 'Slug') || title);
      if (!slug) invalid('A valid blog slug is required.');
      const id = text(body.id, 'Blog id') || makeId('blog');
      const authorId = text(body.authorId, 'Author', { required: true });
      if (!await getRecord('authors', authorId)) invalid('Please select an existing author.');
      const fields = contentFields(body, ['category', 'excerpt', 'metaTitle', 'keywords', 'metaDescription', 'featuredImage']);
      if (fields.featuredImage && !safeUrl(fields.featuredImage, true)) invalid('Use a valid featured image URL.');
      const publication = publishFields(body);
      const blocks = validateBlocks(body.blocks || []);
      const result = await mutateRecord('blogs', id, 'upsert', { ...fields, ...publication, id, title, slug, authorId, blocks, category: fields.category || 'Travel Guide', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      await invalidatePublicContent('blogs', res, [result.previous, result.record]);
      return res.status(200).json({ success: true, blog: result.record });
    }
    if (req.method === 'DELETE') {
      const id = text(req.body?.id || req.query?.id, 'Blog id', { required: true });
      const result = await mutateRecord('blogs', id, 'delete');
      await invalidatePublicContent('blogs', res, [result.previous]);
      return res.status(200).json({ success: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return apiError(res, error, 'Unable to process blog request.'); }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
