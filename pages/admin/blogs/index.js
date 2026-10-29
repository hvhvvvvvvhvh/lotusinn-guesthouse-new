import SiteImage from '../../../components/SiteImage';
import { adminBlogSummary } from '../../../lib/adminContent.js';
import { requireAdminPage } from '../../../lib/adminAuth.js';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import AdminLayout from '../../../components/AdminLayout';
import { getAuthors, getBlogs } from '../../../lib/blogStore';

export async function getServerSideProps(context) {
  const denied = await requireAdminPage(context);
  if (denied) return denied;


  const [blogs, authors] = await Promise.all([getBlogs(), getAuthors()]);
  return { props: { initialBlogs: blogs.map(adminBlogSummary), authors: authors.map(author => ({ id: author.id, name: author.name })) } };
}

export default function BlogsAdmin({ initialBlogs, authors }) {
  const [blogs, setBlogs] = useState(initialBlogs);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [notice, setNotice] = useState('');

  const authorMap = Object.fromEntries(authors.map((a) => [a.id, a.name]));
  const filtered = useMemo(() => blogs.filter((blog) => {
    const haystack = `${blog.title} ${blog.category} ${authorMap[blog.authorId] || ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (status === 'All' || blog.status === status);
  }), [blogs, query, status]);

  const removeBlog = async (id) => {
    if (!window.confirm('Delete this blog post? This action cannot be undone.')) return;
    try {
    const res = await fetch('/api/admin/blogs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setBlogs((prev) => prev.filter((item) => item.id !== id)); setNotice('Blog post deleted successfully.'); }
    else setNotice((await res.json()).message || 'Could not delete blog post.');
    } catch (error) { setNotice(error.message || 'Could not delete blog post.'); }
  };

  return (
    <AdminLayout title="Create, edit and manage Lotus Inn travel content." contentSection>
      <div className="content-page-header">
        <div><span className="eyebrow">CONTENT MANAGEMENT</span><h1>Manage All Blog Posts</h1><p>Search, edit, publish and organize helpful travel content for Lotus Inn guests.</p></div>
        <Link className="content-primary-btn" href="/admin/blogs/new">Create New Blog</Link>
      </div>
      {notice && <div className="content-alert success">{notice}</div>}
      <section className="content-card">
        <div className="content-toolbar">
          <div><label>Search Blogs</label><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a post by title, category or author" /></div>
          <div><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Published</option><option>Draft</option></select></div>
        </div>
        <div className="content-table-wrap">
          <table className="content-table"><thead><tr><th>Post</th><th>Author</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {filtered.length ? filtered.map((blog) => (
              <tr key={blog.id}>
                <td><div className="post-cell">{blog.featuredImage ? <SiteImage src={blog.featuredImage} alt="" /> : <div className="post-placeholder">L</div>}<div><strong>{blog.title}</strong><small>/{blog.slug}</small></div></div></td>
                <td>{authorMap[blog.authorId] || 'Unassigned'}</td><td>{blog.category}</td><td>{blog.publishDate}</td>
                <td><span className={`content-status ${blog.status.toLowerCase()}`}>{blog.status}</span></td>
                <td><div className="row-actions"><Link href={`/admin/blogs/edit?id=${blog.id}`}>Edit</Link><Link href={`/blog/${blog.slug}`} target="_blank">View</Link><button onClick={() => removeBlog(blog.id)}>Delete</button></div></td>
              </tr>
            )) : <tr><td colSpan="6" className="empty-state">No blog posts found. Create your first Lotus Inn article.</td></tr>}
          </tbody></table>
        </div>
      </section>
    </AdminLayout>
  );
}
