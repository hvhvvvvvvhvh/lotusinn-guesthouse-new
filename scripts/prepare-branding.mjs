import fs from 'node:fs/promises';
import sharp from 'sharp';

// Derive browser/preview assets from the existing logo, preserving the brand artwork.
export async function prepareBranding() {
  await fs.mkdir('public/branding', { recursive: true });
  const source = await fs.readFile('public/images/lotusinn-logo.png');
  const crop = await sharp(source).extract({ left: 0, top: 0, width: 900, height: 589 }).toBuffer();
  const mark = await sharp(crop).trim().toBuffer();
  async function icon(size) {
    const inset = Math.round(size * 0.12);
    const content = await sharp(mark).resize(size - 2 * inset, size - 2 * inset, { fit: 'contain', background: '#ffffff' }).toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: '#ffffff' } }).composite([{ input: content, left: inset, top: inset }]).png().toBuffer();
  }
  for (const [size, file] of [[96, 'favicon-96x96.png'], [180, 'apple-touch-icon.png'], [192, 'branding/icon-192.png'], [512, 'branding/icon-512.png']]) await fs.writeFile(`public/${file}`, await icon(size));
  // ICO directory containing actual 32px, 48px and 64px PNG representations.
  const sizes = [32, 48, 64];
  const images = await Promise.all(sizes.map(icon));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((image, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index]; header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8); header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  });
  await fs.writeFile('public/favicon.ico', Buffer.concat([header, ...images]));
  const wordmark = await sharp(source).resize(440, 145, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const background = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#075c43"/><rect x="64" y="54" width="488" height="185" rx="22" fill="#ffffff"/><path d="M920 0h280v630H760z" fill="#ffffff" opacity=".035"/><text x="64" y="346" fill="#ffffff" font-family="Arial,sans-serif" font-size="66" font-weight="700">Lotus Inn Guest House</text><text x="68" y="412" fill="#e2ede6" font-family="Arial,sans-serif" font-size="32">Mirpur, Azad Jammu &amp; Kashmir</text><rect x="68" y="467" width="72" height="4" fill="#d4a017"/><text x="68" y="538" fill="#ffffff" font-family="Arial,sans-serif" font-size="27">www.lotusinnguesthouse.com</text></svg>`);
  await sharp(background).composite([{ input: wordmark, left: 88, top: 74 }]).png().toFile('public/branding/social-preview.png');
}
