export async function getStaticPaths() { return { paths: [], fallback: 'blocking' }; }
import { publicPage } from '../../lib/publicPage.js';
import SiteImage from '../../components/SiteImage';
import Link from 'next/link';
import { getPublicBlogs as getBlogs, getPublicAuthors as getAuthors } from '../../lib/publicBlogStore.js';
import { safeUrl } from '../../lib/contentValidation.js';
import { publicBlog, publicAuthor } from '../../lib/publicContent.js';

export async function getStaticProps(context) {
  const { params } = context;
  const [page, blogs, authors, matchingBlogs] = await Promise.all([publicPage(context), getBlogs(), getAuthors(), getBlogs({ slug: params.slug, full: true })]);
  const publishedBlogs = blogs
    .filter((b) => b.status === 'Published')
    .sort((a, b) => String(b.publishDate || '').localeCompare(String(a.publishDate || '')));
  const blog = matchingBlogs[0];
  if (!blog) return { notFound: true, revalidate: 60 };

  return {
    revalidate: 60,
    props: { siteLayout: page.props.siteLayout, siteImages: page.props.siteImages,
      blog: publicBlog(blog, true),
      author: authors.find((a) => a.id === blog.authorId) ? publicAuthor(authors.find((a) => a.id === blog.authorId)) : null,
      related: publishedBlogs.filter((b) => b.id !== blog.id && b.slug !== blog.slug).slice(0, 5).map(blog => publicBlog(blog)),
    },
  };
}

function readingTime(blog) {
  const text = [blog.title, blog.excerpt, ...(blog.blocks || []).map((b) => [b.text, ...(b.items || []), b.question, b.answer].filter(Boolean).join(' '))].join(' ');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length / 200));
}

export default function BlogDetail({ blog, author, related }) {
  const minutes = readingTime(blog);

  return (
    <>

      <main className="lotus-article-page">
        <div className="lotus-article-breadcrumbs">
          <Link href="/">Home</Link><span>›</span><Link href="/blog">Blog</Link><span>›</span><span>{blog.category || 'Travel Guide'}</span>
        </div>

        <section className="lotus-article-shell">
          <article className="lotus-article-main">
                        {blog.featuredImage && (
              <figure className="lotus-article-featured-wrap">
                <SiteImage loading="eager" fetchPriority="high" className="lotus-article-featured" src={blog.featuredImage} alt={blog.title} />
              </figure>
            )}
            <header className="lotus-article-header">
              <div className="lotus-post-meta"><span>{blog.category || 'Travel Guide'}</span><b>•</b><span>{blog.publishDate || ''}</span><b>•</b><span>{minutes} min read</span></div>
              <h1>{blog.title}</h1>
              {/* {blog.excerpt && <p className="lotus-article-excerpt">{blog.excerpt}</p>} */}

              <div className="lotus-article-author-row">
                <div className="lotus-article-author">
                  {author?.image ? <SiteImage src={author.image} alt={author.name} /> : <div className="lotus-author-fallback">{String(author?.name || 'L').charAt(0).toUpperCase()}</div>}
                  <div><strong>{author ? <Link href={`/authors/${author.slug}`}>{author.name}</Link> : 'Lotus Inn Team'}</strong><span>{author?.role || 'Lotus Inn Guest House'}</span></div>
                </div>
                <Link className="lotus-back-blog" href="/blog">All Guides</Link>
              </div>
            </header>



            <div className="lotus-article-content">
              {(blog.blocks || []).map((block, index) => <Block key={`${block.id || block.type}-${index}`} block={block} />)}
            </div>

            <div className="lotus-article-bottom-cta">
              <div><span>LOTUS INN GUEST HOUSE</span><strong>Planning your visit to Mirpur?</strong><p>Book a comfortable room and enjoy a convenient stay at Lotus Inn.</p></div>
              <Link href="/book-now">Book Your Stay</Link>
            </div>
          </article>

          <aside className="lotus-article-sidebar">
            <div className="lotus-sidebar-card lotus-sticky-card">
              <div className="lotus-sidebar-title"><span className="lotus-eyebrow">KEEP READING</span><h3>Latest Articles</h3></div>
              <div className="lotus-sidebar-list">
                {related.map((item) => (
                  <Link href={`/blog/${item.slug}`} key={item.id} className="lotus-sidebar-item">
                    {item.featuredImage ? <SiteImage src={item.featuredImage} alt="" /> : <div className="lotus-sidebar-fallback">L</div>}
                    <div><strong>{item.title}</strong><small>{item.publishDate}</small></div>
                  </Link>
                ))}
                {!related.length && <p className="lotus-sidebar-empty">More articles will appear here soon.</p>}
              </div>
            </div>

            <div className="lotus-sidebar-card lotus-sidebar-cta">
              <span className="lotus-eyebrow">EXPLORE LOTUS INN</span>
              <h3>Find the right room for your stay</h3>
              <p>Explore our rooms and amenities before you book your visit to Mirpur.</p>
              <Link href="/rooms">Explore Rooms</Link>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

function Block({ block }) {
  if (!block) return null;
  const url = safeUrl(block.url, block.type === 'image');
  if (block.type === 'heading2') return <h2>{block.text}</h2>;
  if (block.type === 'heading3') return <h3>{block.text}</h3>;
  if (block.type === 'bullet' || block.type === 'numbered') {
    const Tag = block.type === 'bullet' ? 'ul' : 'ol';
    return <Tag>{(block.items || []).filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</Tag>;
  }
  if (block.type === 'link') return url ? <div className="lotus-inline-cta"><a href={url} target={url.startsWith('http') ? '_blank' : undefined} rel={url.startsWith('http') ? 'noreferrer' : undefined}>{block.label || url}</a></div> : null;
  if (block.type === 'image') return url ? <figure className="lotus-content-image"><SiteImage src={url} alt={block.alt || ''} /><figcaption>{block.alt || ''}</figcaption></figure> : null;
  if (block.type === 'faq') return <details className="lotus-faq"><summary>{block.question || 'Frequently asked question'}</summary><div>{block.answer}</div></details>;
  return block.text ? <p>{block.text}</p> : null;
}
