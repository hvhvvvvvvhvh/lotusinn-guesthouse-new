
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  const contents = await fs.readFile(fullPath, 'utf8');
  return JSON.parse(contents);
}

function toDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

async function main() {
  const blogsFile = await readJson('data/blogs.json');
  const authorsFile = await readJson('data/authors.json');

  const blogs = Array.isArray(blogsFile)
    ? blogsFile
    : blogsFile.blogs || [];

  const authors = Array.isArray(authorsFile)
    ? authorsFile
    : authorsFile.authors || [];

  console.log(`Found ${authors.length} authors.`);
  console.log(`Found ${blogs.length} blogs.`);

  // Preserve author IDs and original author data.
  const authorRows = authors.map((author) => ({
    id: String(author.id),
    name: author.name || 'Author',
    role: author.role || '',
    bio: author.bio || '',
    avatar: author.avatar || author.image || '',
    email: author.email || '',
    created_at: author.createdAt || new Date().toISOString(),
    data: author,
  }));

  // Insert authors first so blog attribution remains intact.
  if (authorRows.length > 0) {
    const { error } = await supabase
      .from('lotus_blog_authors')
      .upsert(authorRows, { onConflict: 'id' });

    if (error) throw new Error(`Authors migration failed: ${error.message}`);
  }

  console.log('Authors migrated successfully.');

  // Preserve the editor's existing fields and blocks.
  const blogRows = blogs.map((blog) => {
    const status =
      String(blog.status || 'Draft').toLowerCase() === 'published'
        ? 'Published'
        : 'Draft';

    return {
      id: String(blog.id),
      title: blog.title,
      slug: blog.slug,
      author_id: String(blog.authorId || ''),
      category: blog.category || 'Travel Guide',
      publish_date: toDate(blog.publishDate),
      status,
      excerpt: blog.excerpt || '',
      meta_title: blog.metaTitle || '',
      keywords: blog.keywords || '',
      meta_description: blog.metaDescription || '',
      featured_image: blog.featuredImage || '',
      blocks: Array.isArray(blog.blocks) ? blog.blocks : [],
      created_at: blog.createdAt || new Date().toISOString(),
      updated_at: blog.updatedAt || new Date().toISOString(),
      data: blog,
    };
  });

  if (blogRows.length > 0) {
    // Upsert updates matching IDs instead of creating duplicates.
    const { error } = await supabase
      .from('lotus_blog_posts')
      .upsert(blogRows, { onConflict: 'id' });

    if (error) throw new Error(`Blogs migration failed: ${error.message}`);
  }

  console.log('Blogs migrated successfully.');

  const { count: authorCount, error: authorCountError } = await supabase
    .from('lotus_blog_authors')
    .select('*', { count: 'exact', head: true });

  if (authorCountError) throw authorCountError;

  const { count: blogCount, error: blogCountError } = await supabase
    .from('lotus_blog_posts')
    .select('*', { count: 'exact', head: true });

  if (blogCountError) throw blogCountError;

  console.log(`Database now contains ${authorCount} authors.`);
  console.log(`Database now contains ${blogCount} blogs.`);
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
