import { filePaths, readJson } from './dataStore.js';
import { allRecords } from './recordStore.js';
import { waitUntil } from '@vercel/functions';

const publicKeys = ['site', 'rooms', 'blogs', 'authors'];
export async function readPublicJson(key) {
  if (!publicKeys.includes(key)) throw new Error('This dataset cannot use the public content cache.');
  return readJson(filePaths[key]);
}
// Pages Router on-demand ISR: compatible with API handlers and cached HTML.
export async function invalidatePublicContent(key, res, extraPaths = []) {
  if (!publicKeys.includes(key) || !res?.revalidate) return;
  const work = revalidateContent(key, res, extraPaths);
  // Vercel keeps the invocation alive; ISR's 60-second expiry is the retry fallback.
  if (process.env.VERCEL) { waitUntil(work); return; }
  await work;
}
async function revalidateContent(key, res, changedRecords) {
  const common = key === 'site' ? ['/', '/about', '/rooms', '/amenities', '/gallery', '/contact', '/book-now', '/blog']
    : key === 'rooms' ? ['/', '/about', '/rooms', '/amenities', '/book-now'] : ['/', '/blog'];
  const paths = new Set(common);
  const authorIds = new Set();
  try {
  for (const record of changedRecords.filter(Boolean)) {
    if (typeof record === 'string') paths.add(record);
    else if (record.slug) paths.add(`/${key === 'blogs' ? 'blog' : 'authors'}/${record.slug}`);
    if (key === 'blogs' && record.authorId && !authorIds.has(record.authorId)) {
      authorIds.add(record.authorId);
      const author = (await allRecords('authors', { id: record.authorId, fields: ['slug'] }))[0];
      if (author) paths.add(`/authors/${author.slug}`);
    }
  }
    const [rooms, blogs, authors] = await Promise.all([
      ['site', 'rooms'].includes(key) ? readJson(filePaths.rooms) : null,
      key === 'site' ? allRecords('blogs', { fields: ['slug'] }) : null,
      key === 'site' ? allRecords('authors', { fields: ['slug'] }) : null,
    ]);
    for (const room of rooms?.roomsPage.availableRooms || []) paths.add(`/room/${room.slug}`);
    for (const blog of blogs || []) paths.add(`/blog/${blog.slug}`);
    for (const author of authors || []) paths.add(`/authors/${author.slug}`);
    if (key === 'authors') for (const id of new Set(changedRecords.filter(Boolean).map(record => record.id).filter(Boolean))) {
      for (const blog of await allRecords('blogs', { authorId: id, fields: ['slug'] })) paths.add(`/blog/${blog.slug}`);
    }
    const results = await Promise.allSettled([...paths].map(path => res.revalidate(path, { unstable_onlyGenerated: true })));
    if (results.some(result => result.status === 'rejected')) console.warn('Some public pages will refresh on their next scheduled revalidation.');
  } catch { console.warn('Content saved. Public pages will refresh on scheduled revalidation.'); }
}
