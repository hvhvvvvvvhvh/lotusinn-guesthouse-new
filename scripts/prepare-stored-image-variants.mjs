import sharp from 'sharp';
import { getSupabaseAdmin } from '../lib/supabaseClient.js';
import { allRecords } from '../lib/recordStore.js';
import { loadImage, saveImage } from '../lib/imageStorage.js';
const { data, error } = await getSupabaseAdmin().from('lotus_documents').select('data').in('key', ['site', 'rooms']);
if (error) throw new Error('Unable to inspect website image locations.');
const collections = await Promise.all(['blogs', 'authors'].map(dataset => allRecords(dataset)));
const ids = new Set([...JSON.stringify([data, collections]).matchAll(/\/api\/site-image\?id=([a-f0-9]{64})/g)].map(match => match[1]));
let prepared = 0;
for (const id of ids) {
  const original = await loadImage(id);
  if (!original) throw new Error('A referenced website image is missing.');
  await Promise.all([480, 960].map(async width => {
    if (await loadImage(id, width)) return;
    const bytes = await sharp(original).resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await saveImage(id, bytes, width);
  }));
  prepared++;
}
console.log(`Responsive variants are ready for ${prepared} stored website images. Original images and content are unchanged.`);
