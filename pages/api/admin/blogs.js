export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };

import { getBlogs, saveBlogs, makeId, slugify } from '../../../lib/blogStore';

export default async function handler(req, res) {
  try {
    const blogs = await getBlogs();
    if (req.method === 'GET') return res.status(200).json({ blogs });

    if (req.method === 'POST') {
      const body = req.body || {};
      const id = body.id || makeId('blog');
      const slug = slugify(body.slug || body.title);
      if (!body.title?.trim()) return res.status(400).json({ message: 'Blog title is required.' });
      if (!body.authorId) return res.status(400).json({ message: 'Please select an author before saving the blog.' });
      if (!slug) return res.status(400).json({ message: 'A valid blog slug is required.' });
      const slugTaken = blogs.some((item) => item.slug === slug && item.id !== id);
      if (slugTaken) return res.status(409).json({ message: 'That blog slug is already in use. Please choose a different slug.' });

      const nextBlog = {
        id, title: body.title.trim(), slug, authorId: body.authorId || '', category: body.category || 'Travel Guide',
        publishDate: body.publishDate || new Date().toISOString().slice(0, 10), status: body.status || 'Draft',
        excerpt: body.excerpt || '', metaTitle: body.metaTitle || '', keywords: body.keywords || '',
        metaDescription: body.metaDescription || '', featuredImage: body.featuredImage || '',
        blocks: Array.isArray(body.blocks) ? body.blocks : [],
        createdAt: body.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
      };
      const index = blogs.findIndex((item) => item.id === id);
      if (index >= 0) blogs[index] = nextBlog; else blogs.unshift(nextBlog);
      await saveBlogs(blogs);
      return res.status(200).json({ success: true, blog: nextBlog, blogs });
    }

    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      if (!id) return res.status(400).json({ message: 'Blog id is required.' });
      const next = blogs.filter((item) => item.id !== id);
      await saveBlogs(next);
      return res.status(200).json({ success: true, blogs: next });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to process blog request.' });
  }
}
