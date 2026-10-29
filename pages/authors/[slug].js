import { publicPage } from '../../lib/publicPage.js';
import SiteImage from '../../components/SiteImage';
import Link from 'next/link';
import { getAuthors, getBlogs } from '../../lib/blogStore';
import { publicAuthor } from '../../lib/publicContent.js';

export async function getServerSideProps(context) {
  const { params } = context;
  const page = await publicPage(context);
  const [authors, blogs] = await Promise.all([getAuthors(), getBlogs()]);
  const author = authors.find((item) => item.slug === params.slug);
  if (!author) return { notFound: true };
  return { props: { siteLayout: page.props.siteLayout, siteImages: page.props.siteImages, author: publicAuthor(author), blogs: blogs.filter((blog) => blog.authorId === author.id && blog.status === 'Published').map(blog => ({ id: blog.id, title: blog.title, slug: blog.slug })) } };
}

export default function AuthorPage({ author, blogs }) {
  return <main className="public-article"><article><header><div className="article-author">{author.image && <SiteImage src={author.image} alt="" />}<div><strong>{author.name}</strong><small>{author.role}</small></div></div><h1>{author.name}</h1><p>{author.shortBio}</p></header><div className="article-content"><p>{author.biography}</p>{author.expertise?.length ? <><h2>Areas of Expertise</h2><ul>{author.expertise.map((item) => <li key={item}>{item}</li>)}</ul></> : null}<h2>Articles by {author.name}</h2>{blogs.length ? blogs.map((blog) => <p key={blog.id}><Link href={`/blog/${blog.slug}`}>{blog.title}</Link></p>) : <p>No published articles yet.</p>}</div></article></main>;
}
