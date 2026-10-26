import { filePaths, readJson, writeJson } from './dataStore.js';

export const blogFilePaths = { blogs: filePaths.blogs, authors: filePaths.authors };

export const makeId = (prefix = 'item') => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const slugify = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 90);

export async function getBlogs() {
  const data = await readJson(blogFilePaths.blogs);
  return Array.isArray(data?.blogs) ? data.blogs : [];
}

export async function getAuthors() {
  const data = await readJson(blogFilePaths.authors);
  return Array.isArray(data?.authors) ? data.authors : [];
}

export async function saveBlogs(blogs) {
  return writeJson(blogFilePaths.blogs, { blogs });
}

export async function saveAuthors(authors) {
  return writeJson(blogFilePaths.authors, { authors });
}
