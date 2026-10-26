import { requireAdminApi } from '../../../lib/adminAuth.js';
import { getBlogs, getAuthors, makeId, slugify } from '../../../lib/blogStore';
import { filePaths, updateJson } from '../../../lib/dataStore.js';
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
      if (!(await getAuthors()).some(item => item.id === authorId)) invalid('Please select an existing author.');
      const fields = contentFields(body, ['category', 'excerpt', 'metaTitle', 'keywords', 'metaDescription', 'featuredImage']);
      if (fields.featuredImage && !safeUrl(fields.featuredImage, true)) invalid('Use a valid featured image URL.');
      const publication = publishFields(body);
      const blocks = validateBlocks(body.blocks || []);
      const data = await updateJson(filePaths.blogs, data => {
        const blogs = data?.blogs || [];
        if (blogs.some(item => item.slug === slug && item.id !== id)) throw Object.assign(new Error('That blog slug is already in use.'), { status: 409 });
        const current = blogs.find(item => item.id === id);
        const blog = { ...fields, ...publication, id, title, slug, authorId, blocks, category: fields.category || 'Travel Guide', createdAt: current?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
        return { blogs: current ? blogs.map(item => item.id === id ? blog : item) : [blog, ...blogs] };
      });
      return res.status(200).json({ success: true, blog: data.blogs.find(item => item.id === id) });
    }
    if (req.method === 'DELETE') {
      const id = text(req.body?.id || req.query?.id, 'Blog id', { required: true });
      const data = await updateJson(filePaths.blogs, data => ({ blogs: (data?.blogs || []).filter(item => item.id !== id) }));
      return res.status(200).json({ success: true, blogs: data.blogs });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ message: 'Method not allowed.' });
  } catch (error) { return apiError(res, error, 'Unable to process blog request.'); }
}
export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
