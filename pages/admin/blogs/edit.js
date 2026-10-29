import NewBlog from './new';



export default function EditBlog({ authors, initialBlog }) {
  return <NewBlog authors={authors} initialBlog={initialBlog} />;
}
