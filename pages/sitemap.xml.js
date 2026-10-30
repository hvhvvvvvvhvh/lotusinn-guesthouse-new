import { readPublicJson } from '../lib/publicStore.js';
import { getPublicBlogs, getPublicAuthors } from '../lib/publicBlogStore.js';
import { sitemapXml } from '../lib/seo.js';

export async function getServerSideProps({ res }) {
  const [rooms, blogs, authors] = await Promise.all([
    readPublicJson('rooms'),
    getPublicBlogs({ fields: ['slug', 'status', 'updatedAt', 'publishDate'] }),
    getPublicAuthors({ fields: ['slug', 'updatedAt'] }),
  ]);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
  res.write(sitemapXml(rooms, blogs, authors));
  res.end();
  return { props: {} };
}
export default function Sitemap() { return null; }
