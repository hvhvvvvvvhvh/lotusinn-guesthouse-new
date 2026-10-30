import fs from 'node:fs/promises';
import sharp from 'sharp';

// Read-only crawl: no form submissions or changes to production records.
const base = new URL(process.argv[2] || 'https://www.lotusinnguesthouse.com');
const report = { checkedAt: new Date().toISOString(), base: base.origin, pages: [], resources: [], issues: [], notes: [] };
const cache = new Map();
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'");
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(m => [m[1].toLowerCase(), decode(m[2])]));
const issue = (url, message) => report.issues.push({ url, message });
async function read(url) {
  if (!cache.has(url)) cache.set(url, (async () => {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
      return { status: r.status, url: r.url, headers: Object.fromEntries(r.headers), bytes: Buffer.from(await r.arrayBuffer()) };
    } catch (error) { return { status: 0, error: error.message, bytes: Buffer.alloc(0), headers: {} }; }
  })());
  return cache.get(url);
}
const sitemap = await read(new URL('/sitemap.xml', base).href);
if (sitemap.status !== 200) throw new Error('Sitemap unavailable');
const pages = [...sitemap.bytes.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => new URL(new URL(decode(m[1])).pathname, base).href);
const resources = new Map();
const internalLinks = new Set();
function resource(value, context, kind) {
  try {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (!resources.has(url.href)) resources.set(url.href, { url: url.href, contexts: [], kind });
    resources.get(url.href).contexts.push(context);
  } catch { issue(context, `Invalid ${kind} URL: ${value}`); }
}
for (const url of pages) {
  const response = await read(url);
  const html = response.bytes.toString();
  const tags = [...html.matchAll(/<(?:meta|link|img|script)\b[^>]*>/gi)].map(m => ({ tag: m[0], ...attributes(m[0]) }));
  const meta = name => tags.find(t => t.name === name || t.property === name)?.content;
  const canonical = tags.find(t => t.rel === 'canonical')?.href;
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const h1s = [...html.matchAll(/<h1\b[^>]*>/gi)].length;
  if (response.status !== 200) issue(url, `Page returned HTTP ${response.status}`);
  if (!title || !meta('description')) issue(url, 'Missing title or description');
  if (!canonical || new URL(canonical).pathname !== new URL(url).pathname) issue(url, 'Missing or mismatched canonical');
  if (h1s !== 1) issue(url, `Expected one main heading, found ${h1s}`);
  if (!tags.some(t => t.rel === 'icon')) issue(url, 'Missing declared favicon');
  if (!tags.some(t => t.rel === 'apple-touch-icon')) issue(url, 'Missing Apple touch icon');
  if (!tags.some(t => t.rel === 'manifest')) issue(url, 'Missing web manifest');
  for (const name of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card', 'twitter:image:alt']) if (!meta(name)) issue(url, `Missing ${name}`);
  for (const tag of tags) {
    if (tag.src) resource(tag.src, url, /^<img/i.test(tag.tag) ? 'image' : 'script');
    if (tag.srcset) for (const item of tag.srcset.split(',')) resource(item.trim().split(/\s+/)[0], url, 'image');
    if (['icon', 'apple-touch-icon', 'manifest', 'stylesheet'].includes(tag.rel)) resource(tag.href, url, tag.rel);
  }
  if (meta('og:image')) resource(meta('og:image'), url, 'share-image');
  const schemas = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => {
    try { const data = JSON.parse(m[1]); return data['@graph'] || [data]; } catch { issue(url, 'Invalid JSON-LD'); return []; }
  });
  for (const schema of schemas) {
    if (schema['@type'] === 'ProfilePage') {
      const entity = schemas.find(node => node['@id'] === schema.mainEntity?.['@id']) || schema.mainEntity;
      if (!entity?.name || !['Person','Organization'].includes(entity['@type'])) issue(url,'Author profile is missing its required named main entity');
    }
    const logo = schema.logo?.url || schema.logo;
    if (typeof logo === 'string') resource(logo, url, 'logo');
    const schemaImages = Array.isArray(schema.image) ? schema.image : [schema.image];
    for (const image of schemaImages.filter(Boolean)) resource(image.url || image, url, 'image');
  }
  for (const match of html.replace(/<script\b[\s\S]*?<\/script>/gi, '').matchAll(/<a\b[^>]*>/gi)) {
    const href = attributes(match[0]).href;
    if (!href) continue;
    try {
      const link = new URL(href, url);
      if (link.pathname === '/cdn-cgi/l/email-protection') report.notes.push({url,message:'Cloudflare rewrites email links in raw HTML; verify decoded mailto links in the browser.'});
      else if (link.origin === base.origin && !/^\/(api|admin)(\/|$)/.test(link.pathname)) internalLinks.add(new URL(link.pathname, base).href);
      if (/^https?:\/\/(?:www\.)?(?:x\.com|facebook\.com|instagram\.com)\/?$/.test(href)) report.notes.push({url,message:`Placeholder social link: ${href}`});
    } catch { issue(url, `Invalid link: ${href}`); }
  }
  report.pages.push({url,status:response.status,title,canonical,h1s,schemaTypes:schemas.map(s=>s['@type'])});
}
const entries = [...resources.values()];
for (let index = 0; index < entries.length; index += 4) await Promise.all(entries.slice(index,index+4).map(async entry => {
  const r = await read(entry.url);
  const item = {url:entry.url,kind:entry.kind,status:r.status,contentType:r.headers['content-type'],bytes:r.bytes.length};
  if (r.status !== 200) issue(entry.url, `Referenced ${entry.kind} returned HTTP ${r.status}`);
  if (entry.kind === 'manifest' && r.status === 200) {
    try {
      const manifest = JSON.parse(r.bytes);
      for (const icon of manifest.icons || []) {
        const iconUrl = new URL(icon.src, entry.url).href;
        const iconResponse = await read(iconUrl);
        if (iconResponse.status !== 200) issue(iconUrl,'Manifest icon is unavailable');
        const metadata = await sharp(iconResponse.bytes).metadata();
        if (`${metadata.width}x${metadata.height}` !== icon.sizes) issue(iconUrl,'Manifest icon dimensions do not match');
        report.resources.push({url:iconUrl,kind:'manifest-icon',status:iconResponse.status,width:metadata.width,height:metadata.height});
      }
    } catch { issue(entry.url,'Manifest or icon is invalid'); }
  }
  if (/image|logo|icon/.test(entry.kind) && r.status === 200) {
    try {
      const metadata = await sharp(r.bytes).metadata(); item.width=metadata.width; item.height=metadata.height;
      if (['icon','apple-touch-icon'].includes(entry.kind) && metadata.width !== metadata.height) issue(entry.url,'Browser icon is not square');
    }
    catch { if (!/\.ico(?:$|\?)/.test(entry.url)) issue(entry.url,'Referenced image is not decodable'); }
  }
  report.resources.push(item);
}));
for (const url of internalLinks) { const r = await read(url); if (r.status !== 200) issue(url,`Internal link returned HTTP ${r.status}`); }
const robots = await read(new URL('/robots.txt',base).href);
report.robots = {status:robots.status,advertisesSitemap:robots.bytes.toString().includes('Sitemap: https://www.lotusinnguesthouse.com/sitemap.xml')};
const missing = await read(new URL('/seo-audit-nonexistent-page',base).href);
report.missingPageStatus = missing.status;
if (missing.status !== 404) issue('/seo-audit-nonexistent-page','Missing page does not return 404');
report.internalLinksChecked = internalLinks.size;
report.notes = [...new Map(report.notes.map(note=>[note.message,note])).values()];
if (process.argv[3]) await fs.writeFile(process.argv[3],JSON.stringify(report,null,2));
console.log(JSON.stringify({pages:report.pages.length,resources:report.resources.length,internalLinks:internalLinks.size,issues:report.issues,notes:report.notes,robots:report.robots},null,2));
if (report.issues.length) process.exitCode=1;
