import { text, invalid, dateOnly } from './validation.js';

export function safeUrl(value, image = false) {
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (/^\/(?![\/\\])[^\\\s]*$/.test(url)) return url;
  if (/^https?:\/\//i.test(url)) {
    try { const parsed = new URL(url); if (parsed.hostname) return url; } catch {}
  }
  if (image && /^data:image\/(?:png|jpe?g|gif|webp|avif|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(url)) return url;
  return '';
}

export function contentFields(body, names) {
  return Object.fromEntries(names.map(name => [name, text(body[name], name, { max: /image/i.test(name) ? 15000000 : 50000 })]));
}

export function validateBlocks(blocks) {
  if (!Array.isArray(blocks)) invalid('Content blocks must be a list.');
  if (blocks.length > 500) invalid('Too many content blocks.');
  const types = ['paragraph', 'heading2', 'heading3', 'bullet', 'numbered', 'link', 'image', 'faq'];
  return blocks.map(block => {
    if (!block || !types.includes(block.type)) invalid('Invalid content block type.');
    const result = { ...contentFields(block, ['id', 'text', 'title', 'label', 'question', 'answer', 'alt']), type: block.type };
    result.items = Array.isArray(block.items) ? block.items.map(item => text(item, 'List item', { max: 10000 })) : [];
    result.url = text(block.url, 'Block URL', { max: 15000000 });
    if (result.url && !safeUrl(result.url, block.type === 'image')) invalid('Use an HTTP URL, site path or supported image.');
    return result;
  });
}

export function publishFields(body) {
  const status = body.status || 'Draft';
  if (!['Draft', 'Published'].includes(status)) invalid('Invalid blog status.');
  return { status, publishDate: dateOnly(body.publishDate || new Date().toISOString().slice(0, 10), 'Publish date') };
}
