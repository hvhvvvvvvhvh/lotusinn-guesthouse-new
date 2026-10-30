import Home from '../components/Home';
import { cachePublicPage } from '../lib/publicPage.js';
import { withImageDefaults } from '../lib/imageSlots.js';
import { publicDataset } from '../lib/publicDataset.js';
import { readPublicJson } from '../lib/publicStore.js';
import { getPublicBlogs as getBlogs } from '../lib/publicBlogStore.js';
import { publicBlog } from '../lib/publicContent.js';

export async function getStaticProps(context) {
  const [site, rooms, blogs] = await Promise.all([readPublicJson('site'), readPublicJson('rooms'), getBlogs()]);
  cachePublicPage(context.res);
  const publicSite = publicDataset(withImageDefaults(site), 'site');
  const publicRooms = publicDataset(rooms, 'rooms');
  const seen = new Set();
  const posts = blogs.filter(blog => blog.status === 'Published').sort((a,b) => String(b.publishDate).localeCompare(String(a.publishDate))).filter(blog => { if (seen.has(blog.slug)) return false; seen.add(blog.slug); return true; }).slice(0, 3);
  return { revalidate: 60, props: { siteLayout: publicSite.layout, siteImages: publicSite.images, data: { home: { ...publicSite.home, intro: publicSite.about?.intro || null,
    rooms: { ...site.home.rooms, cards: publicRooms.roomsPage.availableRooms.slice(0, 3).map(room => ({ image: room.image, title: room.title, price: room.price, description: room.description || '', link: `/room/${room.slug}`, linkLabel: 'View Details' })) },
    blog: { ...site.home.blog, posts: posts.map(blog => ({ title: blog.title, excerpt: blog.excerpt || '', image: publicBlog(blog).featuredImage || '/images/DSC_0271.JPG', link: `/blog/${blog.slug}`, linkLabel: 'Read More' })) },
  } } } };
}

export default Home;
