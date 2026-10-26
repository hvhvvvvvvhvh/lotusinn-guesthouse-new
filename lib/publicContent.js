function mediaUrl(value, params) {
  return typeof value === 'string' && value.startsWith('data:image/') ? `/api/media?${new URLSearchParams(params)}` : value || '';
}

export function publicBlog(blog, includeBlocks = false) {
  const { blocks, ...summary } = blog;
  return { ...summary, featuredImage: mediaUrl(blog.featuredImage, { blog: blog.id, v: blog.updatedAt || '' }),
    ...(includeBlocks ? { blocks: (blocks || []).map((block, index) => block.type === 'image' ? { ...block, url: mediaUrl(block.url, { blog: blog.id, block: String(index), v: blog.updatedAt || '' }) } : block) } : {}),
  };
}

export function publicAuthor(author) {
  return { ...author, image: mediaUrl(author.image, { author: author.id, v: author.updatedAt || '' }) };
}
