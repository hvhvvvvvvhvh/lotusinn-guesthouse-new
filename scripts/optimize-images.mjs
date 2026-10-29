import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const output = path.join('public', 'optimized');
await fs.mkdir(output, { recursive: true });
const manifest = {};
let before = 0, after = 0;
for (const name of await fs.readdir('public/images')) {
  if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
  const input = await fs.readFile(path.join('public/images', name));
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 12);
  const metadata = await sharp(input).metadata();
  const variants = [];
  for (const width of [480, 960, 1600]) {
    const filename = `${hash}-${width}.webp`;
    const bytes = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    await fs.writeFile(path.join(output, filename), bytes);
    variants.push({ src: `/optimized/${filename}`, width: Math.min(width, metadata.autoOrient?.width || metadata.width) });
    if (width === 1600) after += bytes.length;
  }
  before += input.length;
  manifest[`/images/${name}`] = { variants, width: metadata.width, height: metadata.height };
}
await fs.writeFile('lib/optimizedImages.json', JSON.stringify(manifest));
console.log(`Optimized ${Object.keys(manifest).length} images: ${(before / 1048576).toFixed(1)} MB originals → ${(after / 1048576).toFixed(1)} MB at largest size (${Math.round(100 - after / before * 100)}% smaller).`);
