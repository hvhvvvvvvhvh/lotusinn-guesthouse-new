import { allRecords } from './recordStore.js';
const blogFields = ['id', 'title', 'slug', 'authorId', 'category', 'status', 'publishDate', 'excerpt', 'featuredImage', 'updatedAt'];
const authorFields = ['id', 'slug', 'name', 'role', 'shortBio', 'biography', 'image', 'expertise', 'linkedin', 'seoTitle', 'seoDescription', 'updatedAt'];
export async function getPublicBlogs({ full = false, ...options } = {}) {
  return allRecords('blogs', { status: 'Published', ...(full ? {} : { fields: blogFields }), ...options });
}
export async function getPublicAuthors(options = {}) { return allRecords('authors', { fields: authorFields, ...options }); }
