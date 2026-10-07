import NewBlog from './new';
import { getAuthors, getBlogs } from '../../../lib/blogStore';

export async function getServerSideProps({ query }) {
  const [blogs, authors] = await Promise.all([getBlogs(), getAuthors()]);
  const blog = blogs.find((item) => item.id === query.id);
  if (!blog) return { notFound: true };
  return { props: { authors, initialBlog: blog } };
}

export default function EditBlog({ authors, initialBlog }) {
  return <NewBlog authors={authors} initialBlog={initialBlog} />;
}
