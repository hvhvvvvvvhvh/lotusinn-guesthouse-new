// List screens must not download article bodies or inline image payloads.
export function adminBlogSummary(blog) {
  return { ...Object.fromEntries(['id', 'slug', 'title', 'authorId', 'category', 'publishDate', 'status', 'featuredImage', 'updatedAt'].map(key => [key, blog[key] ?? ''])), featuredImage: adminMedia(blog.featuredImage, { blog: blog.id, v: blog.updatedAt || '' }) };
}
export function adminAuthorSummary(author) {
  return { ...Object.fromEntries(['id', 'slug', 'name', 'role', 'image', 'updatedAt'].map(key => [key, author[key] ?? ''])), image: adminMedia(author.image, { author: author.id, v: author.updatedAt || '' }) };
}
function adminMedia(value, params) { return value?.startsWith('data:image/') ? `/api/admin/media?${new URLSearchParams(params)}` : value || ''; }
