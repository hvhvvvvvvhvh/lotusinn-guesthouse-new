export const SITE_ORIGIN = 'https://www.lotusinnguesthouse.com';
export const BUSINESS_NAME = 'Lotus Inn Guest House';

export const PUBLIC_PAGES = {
  '/': { title: 'Lotus Inn Guest House | Accommodation in Mirpur, AJK', description: 'Plan your stay at Lotus Inn Guest House on Kotli Road, Mirpur, AJK. Explore room options, amenities and photos, and contact our team for availability.' },
  '/rooms': { title: 'Rooms in Mirpur, AJK | Lotus Inn Guest House', description: 'Compare Deluxe, Family and Standard rooms at Lotus Inn Guest House in Mirpur. View current rates, room photos and facilities before requesting your stay.' },
  '/about': { title: 'About Lotus Inn Guest House | Mirpur, AJK', description: 'Discover Lotus Inn Guest House in New Mirpur City, AJK. Learn about our accommodation, hospitality and facilities before planning your visit.' },
  '/amenities': { title: 'Guest House Amenities in Mirpur | Lotus Inn', description: 'Explore the room amenities, dining options and guest services listed at Lotus Inn Guest House in Mirpur, AJK. Contact us about your stay requirements.' },
  '/gallery': { title: 'Room & Guest House Photos | Lotus Inn Mirpur', description: 'Browse photos of Lotus Inn Guest House in Mirpur, AJK. Explore our rooms and guest house spaces, then view room details or contact us to plan your stay.' },
  '/contact': { title: 'Contact & Directions | Lotus Inn Guest House Mirpur', description: 'Contact Lotus Inn Guest House on Kotli Road, New Mirpur City, AJK. Find our phone, email and location, or ask about room availability and your stay.' },
  '/book-now': { title: 'Request a Room Booking in Mirpur | Lotus Inn', description: 'Request your stay at Lotus Inn Guest House in Mirpur, AJK. Choose a room, arrival and departure dates, and send your booking details to our team.' },
  '/blog': { title: 'Mirpur Travel & Accommodation Guides | Lotus Inn', description: 'Read practical Mirpur, AJK travel and accommodation guides from Lotus Inn Guest House, including room comparisons and tips for planning your stay.' },
};

export function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, match => ({ '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }[match])).replace(/\s+/g, ' ').trim();
}

// Canonicals always use the owned domain; booking/query parameters never leak into metadata.
export function canonicalUrl(path = '/') {
  const pathname = String(path).split(/[?#]/)[0];
  return SITE_ORIGIN + (pathname.startsWith('/') && !pathname.startsWith('//') ? pathname.replace(/\/$/, '') || '/' : '/');
}

export function absoluteMediaUrl(value) {
  if (typeof value !== 'string' || !value) return undefined;
  if (value.startsWith('/') && !value.startsWith('//')) return SITE_ORIGIN + value;
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}

export function isSocialProfileUrl(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    return !(/(^|\.)(x\.com|twitter\.com|facebook\.com|instagram\.com|linkedin\.com)$/.test(url.hostname) && url.pathname === '/');
  } catch { return false; }
}

function isoDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value)) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

export function pageSeo(route, props = {}, asPath = route) {
  const room = props.room;
  const blog = props.blog;
  const author = props.author;
  const fixed = PUBLIC_PAGES[route];
  const known = Boolean(fixed || (route === '/room/[type]' && room) || (route === '/blog/[slug]' && blog) || (route === '/authors/[slug]' && author));
  const noindex = !known || Boolean(props.statusCode && props.statusCode >= 400);
  let title = fixed?.title || `${BUSINESS_NAME} | Mirpur, AJK`;
  let description = fixed?.description || PUBLIC_PAGES['/'].description;
  let path = route;
  let label = route === '/' ? BUSINESS_NAME : title.split('|')[0].trim();
  let image = '/branding/social-preview.png';
  if (route === '/room/[type]' && room) {
    path = `/room/${encodeURIComponent(props.type)}`;
    label = plainText(room.name);
    title = `${label} in Mirpur | ${BUSINESS_NAME}`;
    description = `${label} at ${BUSINESS_NAME}, Mirpur, AJK. ${plainText(room.desc)} View room photos, listed rates and facilities, and request availability.`;
    image = room.images?.[0] || image;
  } else if (route === '/blog/[slug]' && blog) {
    path = `/blog/${encodeURIComponent(blog.slug)}`;
    label = plainText(blog.title);
    title = plainText(blog.metaTitle) || `${label} | ${BUSINESS_NAME}`;
    description = plainText(blog.metaDescription || blog.excerpt) || `Read ${label} from ${BUSINESS_NAME} in Mirpur, AJK.`;
    image = blog.featuredImage || image;
  } else if (route === '/authors/[slug]' && author) {
    path = `/authors/${encodeURIComponent(author.slug)}`;
    label = plainText(author.name);
    title = plainText(author.seoTitle) || `${label} | ${BUSINESS_NAME}`;
    description = plainText(author.seoDescription || author.shortBio) || `Read travel and accommodation guides by ${label} at ${BUSINESS_NAME}, Mirpur, AJK.`;
    image = author.image || image;
  }
  const canonical = canonicalUrl(known ? path : asPath);
  const graph = [];
  const layout = props.siteLayout || props.data?.layout;
  const businessId = `${SITE_ORIGIN}/#guest-house`;
  if (!noindex) {
    const contact = layout?.footer?.contact;
    graph.push({ '@type': 'WebSite', '@id': `${SITE_ORIGIN}/#website`, url: `${SITE_ORIGIN}/`, name: BUSINESS_NAME, alternateName: 'Lotus Inn', inLanguage: 'en' });
    if (contact) {
      const selectedLogo = layout.header?.logo;
      const originalLogo = !selectedLogo || ['/images/LotusInnLogo.png', '/images/lotusinn-logo.png', '/images/data-admin-logo.png'].includes(selectedLogo);
      const logo = { '@type': 'ImageObject', url: absoluteMediaUrl(originalLogo ? '/branding/icon-512.png' : selectedLogo), caption: BUSINESS_NAME, ...(originalLogo ? { width: 512, height: 512 } : {}) };
      const sameAs = (layout.footer.socials || []).map(item => absoluteMediaUrl(item.href)).filter(value => value && /(^|\.)(facebook\.com|instagram\.com|linkedin\.com)$/.test(new URL(value).hostname) && new URL(value).pathname !== '/');
      graph.push({ '@type': 'LodgingBusiness', '@id': businessId, name: BUSINESS_NAME, url: `${SITE_ORIGIN}/`, telephone: contact.phone || undefined, email: contact.email || undefined,
        address: contact.address ? { '@type': 'PostalAddress', streetAddress: contact.address.split(',')[0].trim(), addressLocality: 'New Mirpur City', addressRegion: 'Azad Jammu and Kashmir', postalCode: contact.address.match(/\b\d{5}\b/)?.[0], addressCountry: 'PK' } : undefined,
        image: absoluteMediaUrl(props.siteImages?.hero), logo, ...(sameAs.length ? { sameAs } : {}) });
    }
    graph.push({
      '@type': route === '/authors/[slug]' ? 'ProfilePage' : route === '/contact' ? 'ContactPage' : route === '/about' ? 'AboutPage' : 'WebPage',
      '@id': `${canonical}#webpage`, url: canonical, name: plainText(title), description: plainText(description).slice(0, 170),
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` }, about: { '@id': businessId }, inLanguage: 'en',
      ...(route === '/authors/[slug]' ? { mainEntity: { '@id': `${canonical}#author` }, dateModified: isoDate(author.updatedAt) } : {}),
    });
    if (route !== '/') {
      const parents = route === '/room/[type]' ? [{ name: 'Rooms', item: canonicalUrl('/rooms') }] : route === '/blog/[slug]' ? [{ name: 'Travel Guides', item: canonicalUrl('/blog') }] : [];
      graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home', item: `${SITE_ORIGIN}/` }, ...parents, { name: label, item: canonical }].map((item, index) => ({ '@type': 'ListItem', position: index + 1, ...item })) });
    }
    if (route === '/room/[type]') graph.push({ '@type': 'HotelRoom', '@id': `${canonical}#room`, url: canonical, name: label, description: plainText(room.desc), image: (room.images || []).map(absoluteMediaUrl).filter(Boolean), containedInPlace: { '@id': businessId } });
    if (route === '/blog/[slug]') graph.push({ '@type': 'BlogPosting', '@id': `${canonical}#article`, headline: plainText(blog.title), description: plainText(description).slice(0, 170), image: absoluteMediaUrl(image), datePublished: isoDate(blog.publishDate), dateModified: isoDate(blog.updatedAt) || isoDate(blog.publishDate), mainEntityOfPage: { '@id': `${canonical}#webpage` }, author: author ? { '@type': 'Person', name: author.name, url: canonicalUrl(`/authors/${encodeURIComponent(author.slug)}`) } : { '@type': 'Organization', name: BUSINESS_NAME, url: `${SITE_ORIGIN}/` }, publisher: { '@id': businessId } });
    if (route === '/authors/[slug]') graph.push({ '@type': 'Person', '@id': `${canonical}#author`, name: author.name, url: canonical, description: plainText(author.shortBio), image: absoluteMediaUrl(author.image), jobTitle: author.role || undefined });
  }
  const brandedImage = image === '/branding/social-preview.png';
  return { title: plainText(title), description: plainText(description).slice(0, 170), canonical, noindex, image: absoluteMediaUrl(image), imageAlt: brandedImage ? 'Lotus Inn Guest House logo — Mirpur, Azad Jammu and Kashmir' : label, ...(brandedImage ? { imageWidth: 1200, imageHeight: 630, imageType: 'image/png' } : {}), type: blog ? 'article' : 'website', structuredData: { '@context': 'https://schema.org', '@graph': graph } };
}

export function serializeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function sitemapXml(rooms, blogs, authors) {
  const entries = [...Object.keys(PUBLIC_PAGES).map(path => ({ path })),
    ...(rooms?.roomsPage?.availableRooms || []).filter(room => room.slug && Object.hasOwn(rooms.roomDetails || {}, room.slug)).map(room => ({ path: `/room/${encodeURIComponent(room.slug)}` })),
    ...blogs.filter(blog => blog.status === 'Published' && blog.slug).map(blog => ({ path: `/blog/${encodeURIComponent(blog.slug)}`, modified: isoDate(blog.updatedAt) || isoDate(blog.publishDate) })),
    ...authors.filter(author => author.slug).map(author => ({ path: `/authors/${encodeURIComponent(author.slug)}`, modified: isoDate(author.updatedAt) }))];
  const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  const seen = new Set();
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.filter(entry => { if (seen.has(entry.path)) return false; seen.add(entry.path); return true; }).map(entry => `  <url><loc>${escape(canonicalUrl(entry.path))}</loc>${entry.modified ? `<lastmod>${entry.modified}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>';
}
