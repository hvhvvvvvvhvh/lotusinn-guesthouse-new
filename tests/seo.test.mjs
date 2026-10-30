import test from 'node:test';
import assert from 'node:assert/strict';
import { pageSeo, canonicalUrl, sitemapXml, serializeJsonLd, isSocialProfileUrl, SITE_ORIGIN, PUBLIC_PAGES } from '../lib/seo.js';
import fs from 'node:fs/promises';
import sharp from 'sharp';

test('public pages have unique metadata and query-free canonical URLs', () => {
  const titles = new Set();
  for (const route of Object.keys(PUBLIC_PAGES)) {
    const seo = pageSeo(route, {}, `${route}?email=private@example.com`);
    assert.equal(seo.noindex, false);
    assert.ok(seo.description.length >= 80);
    assert.ok(!titles.has(seo.title));
    titles.add(seo.title);
    assert.equal(seo.canonical, canonicalUrl(route));
    assert.ok(!JSON.stringify(seo).includes('private@example.com'));
  }
  assert.equal(canonicalUrl('//evil.example/path?secret=x'), `${SITE_ORIGIN}/`);
});

test('dynamic pages respect CMS metadata, valid dates and author identity', () => {
  const room = pageSeo('/room/[type]', { type: 'family', room: { name: 'Family Room', desc: 'Two bedrooms', images: [] } });
  assert.equal(room.canonical, `${SITE_ORIGIN}/room/family`);
  assert.match(room.title, /Family Room/);
  assert.ok(room.structuredData['@graph'].some(node => node['@type'] === 'HotelRoom'));
  const blog = pageSeo('/blog/[slug]', { blog: { slug: 'guide', title: 'Guide', metaTitle: 'Custom title', metaDescription: 'Written for guests', publishDate: '2026-10-30', updatedAt: 'not a date' }, author: { name: 'Writer', slug: 'writer' } });
  assert.equal(blog.title, 'Custom title');
  const article = blog.structuredData['@graph'].find(node => node['@type'] === 'BlogPosting');
  assert.equal(article.author.url, `${SITE_ORIGIN}/authors/writer`);
  assert.equal(article.datePublished, '2026-10-30T00:00:00.000Z');
  assert.equal(pageSeo('/authors/[slug]', { author: { slug: 'writer', name: 'Writer', seoTitle: 'About Writer' } }).title, 'About Writer');
});

test('private, missing and error pages are excluded from indexing and structured data', () => {
  for (const route of ['/admin/login', '/admin/images', '/_error', '/404', '/blog/[slug]']) {
    const seo = pageSeo(route, {}, '/admin/login?next=private');
    assert.equal(seo.noindex, true);
    assert.deepEqual(seo.structuredData['@graph'], []);
  }
});

test('business data uses CMS contact details without fabricated reviews or coordinates', () => {
  const seo = pageSeo('/', { siteLayout: { footer: { contact: { phone: '123', email: 'hello@example.com', address: 'Actual street' }, socials: [{ href: 'https://x.com/' }, { href: 'https://www.instagram.com/actual/' }] } } });
  const business = seo.structuredData['@graph'].find(node => node['@type'] === 'LodgingBusiness');
  assert.equal(business.telephone, '123');
  assert.equal(business.address.streetAddress, 'Actual street');
  assert.deepEqual(business.sameAs, ['https://www.instagram.com/actual/']);
  assert.ok(!business.aggregateRating && !business.review && !business.geo);
});

test('CMS text cannot escape its JSON-LD script', () => {
  const payload = { text: '</script><script>alert(1)</script>\u2028' };
  const encoded = serializeJsonLd(payload);
  assert.ok(!encoded.includes('<'));
  assert.deepEqual(JSON.parse(encoded), payload);
});

test('sitemap includes live rooms and published posts only, without duplicates or fabricated dates', () => {
  const xml = sitemapXml({ roomsPage: { availableRooms: [{ slug: 'family' }, { slug: 'removed' }] }, roomDetails: { family: {} } }, [
    { slug: 'guide', status: 'Published', updatedAt: '2026-10-30T10:00:00Z' },
    { slug: 'guide', status: 'Published' }, { slug: 'draft', status: 'Draft' },
  ], [{ slug: 'writer' }]);
  assert.match(xml, /\/room\/family/);
  assert.match(xml, /\/authors\/writer/);
  assert.ok(!xml.includes('removed') && !xml.includes('draft') && !xml.includes('admin'));
  assert.equal((xml.match(/\/blog\/guide/g) || []).length, 1);
  assert.equal((xml.match(/<lastmod>/g) || []).length, 1);
});

test('general pages use the branded card while room and article images remain specific', () => {
  const home = pageSeo('/');
  assert.equal(home.image, `${SITE_ORIGIN}/branding/social-preview.png`);
  assert.equal(home.imageWidth, 1200);
  assert.equal(home.imageHeight, 630);
  assert.match(home.imageAlt, /logo/);
  const room = pageSeo('/room/[type]', { type: 'family', room: { name: 'Family', images: ['/images/family.jpg'] } });
  assert.equal(room.image, `${SITE_ORIGIN}/images/family.jpg`);
  assert.equal(room.imageWidth, undefined, 'Do not declare guessed dimensions for uploaded photos.');
  const blog = pageSeo('/blog/[slug]', { blog: { slug: 'guide', title: 'Guide', featuredImage: '/images/guide.jpg' } });
  assert.equal(blog.image, `${SITE_ORIGIN}/images/guide.jpg`);
});

test('generated favicon, app icons, manifest and branded preview match their declared formats and dimensions', async () => {
  for (const [name, size] of [['favicon-96x96.png', 96], ['apple-touch-icon.png', 180], ['branding/icon-192.png', 192], ['branding/icon-512.png', 512]]) {
    const metadata = await sharp(`public/${name}`).metadata();
    assert.equal(metadata.width, size);
    assert.equal(metadata.height, size);
    assert.equal(metadata.format, 'png');
  }
  const preview = await sharp('public/branding/social-preview.png').metadata();
  assert.equal(preview.width, 1200); assert.equal(preview.height, 630);
  const ico = await fs.readFile('public/favicon.ico');
  assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 3);
  for (let i = 0; i < 3; i++) {
    const entry = 6 + 16 * i, length = ico.readUInt32LE(entry + 8), offset = ico.readUInt32LE(entry + 12);
    const metadata = await sharp(ico.subarray(offset, offset + length)).metadata();
    assert.equal(metadata.width, ico[entry]); assert.equal(metadata.height, ico[entry + 1]);
  }
  const manifest = JSON.parse(await fs.readFile('public/site.webmanifest', 'utf8'));
  assert.equal(manifest.name, 'Lotus Inn Guest House');
  for (const icon of manifest.icons) await fs.access(`public${icon.src}`);
});

test('placeholder social homepages are hidden while real profile and contact URLs remain', () => {
  assert.equal(isSocialProfileUrl('https://x.com/'), false);
  assert.equal(isSocialProfileUrl('javascript:alert(1)'), false);
  assert.equal(isSocialProfileUrl('https://www.instagram.com/lotusinnguesthouse/'), true);
  assert.equal(isSocialProfileUrl('https://www.facebook.com/profile.php?id=100063767985114'), true);
  assert.equal(isSocialProfileUrl('https://wa.me/923463260347'), true);
});

test('author profile declares its actual person as the required main entity', () => {
  const seo = pageSeo('/authors/[slug]', { author: { slug: 'writer', name: 'Writer', updatedAt: '2026-10-30T10:00:00Z' } });
  const profile = seo.structuredData['@graph'].find(node => node['@type'] === 'ProfilePage');
  const person = seo.structuredData['@graph'].find(node => node['@type'] === 'Person');
  assert.equal(profile.mainEntity['@id'], person['@id']);
  assert.equal(person.name, 'Writer');
  assert.equal(profile.dateModified, '2026-10-30T10:00:00.000Z');
});
