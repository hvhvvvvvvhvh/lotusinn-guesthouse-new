import { filePaths, readJson } from './dataStore.js';

const publicKeys = ['site', 'rooms', 'blogs', 'authors'];
export async function readPublicJson(key) {
  if (!publicKeys.includes(key)) throw new Error('This dataset cannot use the public content cache.');
  return readJson(filePaths[key]);
}
// Pages Router on-demand ISR: compatible with API handlers and cached HTML.
export async function invalidatePublicContent(key, res, extraPaths = []) {
  if (!publicKeys.includes(key) || !res?.revalidate) return;
  const common = key === 'site' ? ['/', '/about', '/rooms', '/amenities', '/gallery', '/contact', '/book-now', '/blog']
    : key === 'rooms' ? ['/', '/about', '/rooms', '/amenities', '/book-now'] : ['/', '/blog'];
  const paths = new Set([...common, ...extraPaths]);
  try {
    const [rooms, blogs, authors] = await Promise.all([
      ['site', 'rooms'].includes(key) ? readJson(filePaths.rooms) : null,
      key !== 'rooms' ? readJson(filePaths.blogs) : null,
      key !== 'rooms' ? readJson(filePaths.authors) : null,
    ]);
    for (const room of rooms?.roomsPage.availableRooms || []) paths.add(`/room/${room.slug}`);
    for (const blog of blogs?.blogs || []) paths.add(`/blog/${blog.slug}`);
    for (const author of authors?.authors || []) paths.add(`/authors/${author.slug}`);
    const results = await Promise.allSettled([...paths].map(path => res.revalidate(path, { unstable_onlyGenerated: true })));
    if (results.some(result => result.status === 'rejected')) console.warn('Some public pages will refresh on their next scheduled revalidation.');
  } catch { console.warn('Content saved. Public pages will refresh on scheduled revalidation.'); }
}
