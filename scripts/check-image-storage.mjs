import fs from 'node:fs/promises';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { saveImage, loadImage } from '../lib/imageStorage.js';
// Reuse an existing public website photo; never modify live page assignments.
const bytes = await sharp(await fs.readFile('public/images/DSC_0271.JPG')).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
const id = createHash('sha256').update(bytes).digest('hex');
await saveImage(id, bytes);
const result = await loadImage(id);
if (!result?.equals(bytes)) throw new Error('Image storage round trip failed.');
console.log(`PASS: website photo persisted and retrieved (${bytes.length} bytes). No live page assignments changed.`);
