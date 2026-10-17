import Head from 'next/head';
import Link from 'next/link';
import { getBlogs, getAuthors } from '../../lib/blogStore';

export async function getServerSideProps() {
  const [blogs, authors] = await Promise.all([getBlogs(), getAuthors()]);
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

  return { props: { blogs: unique, authors } };
}

export default function BlogIndex({ blogs, authors }) {
  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a]));
  const featured = blogs[0];
  const latest = blogs.slice(1, 5);
  const cards = blogs.slice(1);
  const featuredAuthor = featured ? authorMap[featured.authorId] : null;

  return (
    <>
      <Head>
        <title>Insights &amp; Travel Guides | Lotus Inn Guest House</title>
        <meta name="description" content="Helpful travel guides, local insights and practical information for guests visiting Mirpur, AJK." />
      </Head>

      <main className="lotus-blog-page">
        <section className="lotus-blog-hero">
          <div className="lotus-blog-hero-inner">
            {/* <span className="lotus-eyebrow">LOTUS INN JOURNAL</span> */}
            <h1>Insights &amp; Travel Guides</h1>
            <p>Helpful travel advice, local guides and practical information for guests visiting Mirpur, AJK.</p>
          </div>
        </section>

        <section className="lotus-blog-featured">
          {featured ? (
            <>
              <article className="lotus-featured-card">
                                <div className="lotus-featured-body">
                  <div className="lotus-post-meta"><span>{featured.category || 'Travel Guide'}</span><b>•</b><span>{featured.publishDate || ''}</span></div>
                  <h2><Link href={`/blog/${featured.slug}`}>{featured.title}</Link></h2>
                  {featured.excerpt && <p>{featured.excerpt}</p>}
                  <div className="lotus-featured-bottom"><span>By {featuredAuthor?.name || 'Lotus Inn Team'}</span><Link href={`/blog/${featured.slug}`}>Read Article <span>→</span></Link></div>
                </div>
                <Link href={`/blog/${featured.slug}`} className="lotus-featured-image">
                  {featured.featuredImage ? <img src={featured.featuredImage} alt={featured.title} /> : <div className="lotus-post-image-fallback">Lotus Inn</div>}
                </Link>

              </article>

              {/* <aside className="lotus-latest-sidebar">
                <div className="lotus-sidebar-card">
                  <span className="lotus-eyebrow">LATEST ARTICLES</span>
                  <div className="lotus-sidebar-list">
                    {latest.length ? latest.map((item) => (
                      <Link href={`/blog/${item.slug}`} key={item.id} className="lotus-sidebar-item">
                        {item.featuredImage ? <img src={item.featuredImage} alt="" /> : <div className="lotus-sidebar-fallback">L</div>}
                        <div><strong>{item.title}</strong><small>{item.publishDate || ''}</small></div>
                      </Link>
                    )) : <p className="lotus-sidebar-empty">More articles will appear here soon.</p>}
                  </div>
                </div>
                <div className="lotus-sidebar-card lotus-sidebar-cta">
                  <span className="lotus-eyebrow">PLAN YOUR STAY</span>
                  <h3>Need a comfortable stay in Mirpur?</h3>
                  <p>Explore our rooms and make your reservation directly with Lotus Inn Guest House.</p>
                  <Link href="/book-now">Book Your Stay</Link>
                </div>
              </aside> */}
            </>
          ) : (
            <div className="lotus-empty-blog"><strong>No published articles yet.</strong><p>Our latest travel guides and local insights will appear here soon.</p></div>
          )}
        </section>

        {cards.length > 0 && (
          <section className="lotus-blog-listing">
            {/* <div className="lotus-listing-heading">
              <div><span className="lotus-eyebrow">MORE FROM LOTUS INN</span><h2>Latest Guides</h2></div>
              <p>{blogs.length} published {blogs.length === 1 ? 'guide' : 'guides'} to explore.</p>
            </div> */}
            <div className="lotus-post-grid-three">
              {cards.map((blog) => {
                const author = authorMap[blog.authorId];
                return (
                  <article key={blog.id} className="lotus-post-card">
                    <Link href={`/blog/${blog.slug}`} className="lotus-post-card-image" aria-label={`Read ${blog.title}`}>
                      {blog.featuredImage ? <img src={blog.featuredImage} alt={blog.title} /> : <div className="lotus-post-image-fallback">Lotus Inn</div>}
                      <span className="lotus-card-category">{blog.category || 'Travel Guide'}</span>
                    </Link>
                    <div className="lotus-post-card-body">
                      <div className="lotus-post-meta"><span>{blog.category || 'Travel Guide'}</span><b>•</b><span>{blog.publishDate || ''}</span></div>
                      <h3><Link href={`/blog/${blog.slug}`}>{blog.title}</Link></h3>
                      {blog.excerpt && <p>{blog.excerpt}</p>}
                      <div className="lotus-card-bottom"><span>By {author?.name || 'Lotus Inn Team'}</span><Link href={`/blog/${blog.slug}`}>Read <span>→</span></Link></div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
