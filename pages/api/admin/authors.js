import { getAuthors, saveAuthors, makeId, slugify } from '../../../lib/blogStore';

export default async function handler(req, res) {
  try {
    const authors = await getAuthors();
    if (req.method === 'GET') return res.status(200).json({ authors });

    if (req.method === 'POST') {
      const body = req.body || {};
      const id = body.id || makeId('author');
      const slug = slugify(body.slug || body.name);
      if (!body.name?.trim()) return res.status(400).json({ message: 'Author name is required.' });
      if (!slug) return res.status(400).json({ message: 'A valid author slug is required.' });

      const nextAuthor = {
        id, name: body.name.trim(), slug, role: body.role || '', email: body.email || '',
        shortBio: body.shortBio || '', biography: body.biography || '', image: body.image || '',
        expertise: Array.isArray(body.expertise) ? body.expertise : [], linkedin: body.linkedin || '',
        seoTitle: body.seoTitle || '', seoDescription: body.seoDescription || '',
        updatedAt: new Date().toISOString(), createdAt: body.createdAt || new Date().toISOString()
      };
      const index = authors.findIndex((item) => item.id === id);
      if (index >= 0) authors[index] = nextAuthor; else authors.unshift(nextAuthor);
      await saveAuthors(authors);
      return res.status(200).json({ success: true, author: nextAuthor, authors });
    }

    if (req.method === 'DELETE') {
      const id = req.body?.id || req.query?.id;
      if (!id) return res.status(400).json({ message: 'Author id is required.' });
      const next = authors.filter((item) => item.id !== id);
      await saveAuthors(next);
      return res.status(200).json({ success: true, authors: next });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to process author request.' });
  }
}
