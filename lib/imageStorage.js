import fs from 'node:fs/promises';
import path from 'node:path';
import { getSupabaseAdmin, storageDriver } from './supabaseClient.js';

const bucket = 'lotus-website-images';
const directory = () => process.env.LOTUS_MEDIA_DIR || path.join(process.cwd(), 'data', 'uploads');
export async function saveImage(id, bytes) {
  if (storageDriver() === 'supabase') {
    const client = getSupabaseAdmin();
    const { error } = await client.storage.from(bucket).upload(`${id}.webp`, bytes, { contentType: 'image/webp', upsert: false });
    if (!error || error.statusCode === '409' || /already exists/i.test(error.message)) return;
    if (!/bucket not found/i.test(error.message)) throw error;
    const created = await client.storage.createBucket(bucket, { public: false, fileSizeLimit: 3 * 1024 * 1024, allowedMimeTypes: ['image/webp'] });
    if (created.error && !/already exists/i.test(created.error.message)) throw created.error;
    const retry = await client.storage.from(bucket).upload(`${id}.webp`, bytes, { contentType: 'image/webp', upsert: false });
    if (retry.error && retry.error.statusCode !== '409' && !/already exists/i.test(retry.error.message)) throw retry.error;
  } else {
    await fs.mkdir(directory(), { recursive: true });
    await fs.writeFile(path.join(directory(), `${id}.webp`), bytes);
  }
}
export async function loadImage(id) {
  if (storageDriver() === 'supabase') {
    const { data, error } = await getSupabaseAdmin().storage.from(bucket).download(`${id}.webp`);
    if (error) { if (error.statusCode === '404' || /not found/i.test(error.message)) return null; throw error; }
    return Buffer.from(await data.arrayBuffer());
  }
  try { return await fs.readFile(path.join(directory(), `${id}.webp`)); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
