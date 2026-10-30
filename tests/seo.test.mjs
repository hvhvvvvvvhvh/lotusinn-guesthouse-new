import test from 'node:test';
import assert from 'node:assert/strict';
import { pageSeo, canonicalUrl, sitemapXml, serializeJsonLd, SITE_ORIGIN, PUBLIC_PAGES } from '../lib/seo.js';

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
