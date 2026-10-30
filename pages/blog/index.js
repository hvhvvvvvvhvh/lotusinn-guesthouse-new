import { publicPage } from '../../lib/publicPage.js';
import SiteImage from '../../components/SiteImage';
import Link from 'next/link';
import { getPublicBlogs as getBlogs, getPublicAuthors as getAuthors } from '../../lib/publicBlogStore.js';
import { publicBlog, publicAuthor } from '../../lib/publicContent.js';

export async function getStaticProps(context) {
  const { params } = context;
  const [page, blogs, authors] = await Promise.all([publicPage(context), getBlogs(), getAuthors()]);
  const published = blogs
    .filter((b) => b.status === 'Published')
    .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || '')));

  // Old test data can contain duplicate slugs. Keep the newest record on the public site.
  const seen = new Set();
  const unique = published.filter((blog) => {
    const key = blog.slug || blog.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { revalidate: 60, props: { siteLayout: page.props.siteLayout, siteImages: page.props.siteImages, blogs: unique.map(blog => publicBlog(blog)), authors: authors.map(publicAuthor) } };
}

import { PageHeading, PageCTA, SectionHeading } from '../../components/PublicPage';
import s from '../../styles/PublicPages.module.css';
import a from '../../styles/Articles.module.css';
export default function BlogIndex({ blogs, authors }) {
  const authorMap = Object.fromEntries(authors.map(author => [author.id, author]));
  const [featured, ...cards] = blogs;
  return <main className={`${s.page} ${a.blog}`}>
    <PageHeading eyebrow="The Lotus Inn journal" title="Insights & Travel Guides" text="Local inspiration and practical advice for a comfortable visit to Mirpur, AJK."/>
    <div className={s.wrap}>
      {featured ? <section className={s.section} aria-label="Featured travel guide"><article className={a.featured}><Link href={`/blog/${featured.slug}`} className={a.featuredImage}>{featured.featuredImage && <SiteImage src={featured.featuredImage} alt={featured.title} loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 50vw"/>}</Link><div className={a.featuredCopy}><p className={s.eyebrow}>FEATURED GUIDE · {featured.category || 'Travel'}</p><h2><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2><p>{featured.excerpt}</p><div className={a.byline}><span>{authorMap[featured.authorId]?.name || 'Lotus Inn Team'}</span><span>{featured.publishDate}</span></div><Link href={`/blog/${featured.slug}`} className={s.textLink}>Read the guide <span aria-hidden="true">↗</span></Link></div></article></section> : <section className={`${s.empty} ${s.section}`}><h2>Our journal is coming soon.</h2><p>Check back for guides and ideas for your next visit.</p></section>}
      {!!cards.length && <section className={s.section}><SectionHeading eyebrow="MORE FROM MIRPUR" title="The latest stories"/><div className={a.grid}>{cards.map(blog => <article key={blog.id} className={a.card}><Link href={`/blog/${blog.slug}`} className={a.cardImage} aria-label={`Read ${blog.title}`}>{blog.featuredImage && <SiteImage src={blog.featuredImage} alt={blog.title} sizes="(max-width: 760px) 100vw, 33vw"/>}</Link><div className={a.cardCopy}><p className={s.eyebrow}>{blog.category || 'Travel Guide'}</p><h3><Link href={`/blog/${blog.slug}`}>{blog.title}</Link></h3><p>{blog.excerpt}</p><div className={a.cardBottom}><span>{blog.publishDate}</span><Link href={`/blog/${blog.slug}`} className={s.textLink}>Read <span aria-hidden="true">↗</span></Link></div></div></article>)}</div></section>}
    </div><PageCTA/>
  </main>;
}
