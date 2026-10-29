import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { filePaths, readJson, updateJson } from '../lib/dataStore.js';
import { saveImage } from '../lib/imageStorage.js';
import { imageSlots, withImageDefaults } from '../lib/imageSlots.js';

const apply = process.argv.includes('--apply');
const remote = process.argv.includes('--remote');
const keys = ['site', 'rooms', 'blogs', 'authors'];
const documents = Object.fromEntries(await Promise.all(keys.map(async key => [key, await readJson(filePaths[key])])));
if (remote) documents.site = withImageDefaults(documents.site);
const originals = new Set();
function visit(value, transform) {
  if (typeof value === 'string') return /^data:image\//i.test(value) ? transform(value) : value;
  if (Array.isArray(value)) return value.map(item => visit(item, transform));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item, transform)]));
  return value;
}
for (const doc of Object.values(documents)) visit(doc, value => { originals.add(value); return value; });
const remoteHosts = ['images.unsplash.com', 'randomuser.me', 'kinsley.bslthemes.com'];
const remoteSources = new Set();
if (remote) for (const slot of imageSlots(documents.site, documents.rooms)) {
  try { if (new URL(slot.value).protocol === 'https:' && remoteHosts.includes(new URL(slot.value).hostname)) remoteSources.add(slot.value); } catch {}
}
console.log(`Found ${originals.size} embedded website photos (${Math.round([...originals].reduce((sum, value) => sum + value.length, 0) / 1024)} KB).`);
if (remote) console.log(`Found ${remoteSources.size} existing externally hosted website photos.`);
if (!apply) { console.log('Dry run only. Use --apply to upload optimized photos and replace matching image values.'); process.exit(0); }
const backupRoot = process.env.LOTUS_BACKUP_DIR || path.join(process.cwd(), 'data', 'backups');
await fs.mkdir(backupRoot, { recursive: true });
const replacements = new Map();
for (const original of [...originals, ...remoteSources]) {
  let source;
  if (original.startsWith('data:')) {
    const match = /^data:image\/(?:png|jpe?g|webp|gif|avif|svg\+xml);base64,([a-z0-9+/=\s]+)$/i.exec(original);
    if (!match) throw new Error('An embedded image has an unsupported format. No documents were changed.');
    source = Buffer.from(match[1], 'base64');
  } else {
    try {
      const response = await fetch(original, { signal: AbortSignal.timeout(20000), redirect: 'error' });
      if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image unavailable.');
      if (Number(response.headers.get('content-length')) > 10000000) throw new Error('Image too large.');
      source = Buffer.from(await response.arrayBuffer());
      if (source.length > 10000000) throw new Error('Image too large.');
    } catch { console.log(`Skipped an unavailable image on ${new URL(original).hostname}; existing image kept.`); continue; }
  }
  const image = await sharp(source, { limitInputPixels: 40000000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const id = createHash('sha256').update(image).digest('hex');
  await saveImage(id, image);
  replacements.set(original, `/api/site-image?id=${id}`);
}
function replace(value) {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map(replace);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replace(item)]));
  return value;
}
for (const key of keys) {
  const before = JSON.stringify(documents[key]);
  const after = JSON.stringify(replace(documents[key]));
  if (before === after) continue;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  await fs.writeFile(path.join(backupRoot, `${key}-${stamp}.json`), before, { flag: 'wx' });
  // Re-read inside the versioned transaction; unrelated concurrent edits survive.
  await updateJson(filePaths[key], current => replace(remote && key === 'site' ? withImageDefaults(current) : current));
  console.log(`${key}: ${Buffer.byteLength(before)} → ${Buffer.byteLength(after)} bytes. Original backed up; matching image values replaced.`);
}
