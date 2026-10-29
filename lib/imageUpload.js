import { adminRequest } from './adminClient.js';
export async function uploadImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP, AVIF or GIF image.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Choose an image smaller than 3 MB.');
  const response = await adminRequest('/api/admin/images/upload', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Image upload failed.');
  return result.url;
}
