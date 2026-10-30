export async function getStaticPaths() { return { paths: [], fallback: 'blocking' }; }
import { publicPage } from '../../lib/publicPage.js';
import SiteImage from '../../components/SiteImage';
import Link from 'next/link';
import { getPublicAuthors as getAuthors, getPublicBlogs as getBlogs } from '../../lib/publicBlogStore.js';
import { publicAuthor } from '../../lib/publicContent.js';

export async function getStaticProps(context) {
  const { params } = context;
  const [page, authors] = await Promise.all([publicPage(context), getAuthors({ slug: params.slug })]);
  const author = authors.find((item) => item.slug === params.slug);
  if (!author) return { notFound: true, revalidate: 60 };
  const blogs = await getBlogs({ authorId: author.id, fields: ['id', 'title', 'slug', 'status', 'authorId'] });
  return { revalidate: 60, props: { siteLayout: page.props.siteLayout, siteImages: page.props.siteImages, author: publicAuthor(author), blogs: blogs.filter((blog) => blog.authorId === author.id && blog.status === 'Published').map(blog => ({ id: blog.id, title: blog.title, slug: blog.slug })) } };
}

import { PageCTA } from '../../components/PublicPage';
import s from '../../styles/PublicPages.module.css';
import a from '../../styles/Articles.module.css';
export default function AuthorPage({ author, blogs }) {
  const hasBio = Boolean(author.biography?.trim() || author.expertise?.length);
  return <main className={`${s.page} ${a.author}`}><div className={`${s.wrap} ${s.section}`}><nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/blog">Journal</Link><span>/</span><span>{author.name}</span></nav><header className={a.authorHeader}>{author.image ? <SiteImage src={author.image} alt={author.name} sizes="120px"/> : <span className={a.authorInitial} aria-hidden="true">{author.name?.charAt(0)}</span>}<div><p className={s.eyebrow}>{author.role || 'Lotus Inn contributor'}</p><h1>{author.name}</h1><p className={s.lead}>{author.shortBio}</p></div></header><div className={`${a.authorBody} ${!hasBio ? a.authorBodySingle : ''}`}>{hasBio && <section><h2>About {author.name}</h2><p>{author.biography}</p>{!!author.expertise?.length && <><h3>Areas of expertise</h3><ul className={s.checkList}>{author.expertise.map(item => <li key={item}>{item}</li>)}</ul></>}</section>}<section><p className={s.eyebrow}>FROM THE JOURNAL</p><h2>Articles by {author.name}</h2><div className={a.authorArticles}>{blogs.length ? blogs.map(blog => <Link key={blog.id} href={`/blog/${blog.slug}`}><h3>{blog.title}</h3><span aria-hidden="true">↗</span></Link>) : <p>No published articles yet.</p>}</div></section></div></div><PageCTA/></main>;
}
