import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import sharp from 'sharp';

// Every private-data mutation uses a disposable directory, never real records.
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lotus-integration-'));
for (const name of ['bookings', 'messages', 'expenses', 'authors', 'blogs']) await fs.writeFile(path.join(directory, `${name}.json`), JSON.stringify({ [name]: [] }));
const publicDirectory = path.join(directory, 'public-data');
await fs.mkdir(publicDirectory);
for (const name of ['siteData', 'roomsData']) await fs.copyFile(path.join('public', 'data', `${name}.json`), path.join(publicDirectory, `${name}.json`));
const socket = net.createServer();
socket.listen(0, '127.0.0.1');
await once(socket, 'listening');
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const password = crypto.randomUUID();
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  env: { ...process.env, NODE_ENV: 'production', LOTUS_STORAGE_DRIVER: 'json', ADMIN_PASSWORD: password, ADMIN_SESSION_SECRET: crypto.randomUUID(), LOTUS_DATA_DIR: directory, LOTUS_PUBLIC_DATA_DIR: publicDirectory, LOTUS_MEDIA_DIR: path.join(directory, 'uploads') },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let logs = '';
server.stdout.on('data', data => { logs = (logs + data).slice(-12000); });
server.stderr.on('data', data => { logs = (logs + data).slice(-12000); });
const base = `http://127.0.0.1:${port}`;
let cookie = '';
let checks = 0;
async function request(url, { method = 'GET', body, rawBody, admin = false, headers = {}, status = 200 } = {}) {
  const response = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(admin ? { Cookie: cookie } : {}), ...headers }, ...(rawBody ? { body: rawBody } : body ? { body: JSON.stringify(body) } : {}), redirect: 'manual' });
  assert.equal(response.status, status, `${method} ${url}: ${await response.clone().text().then(t => t.slice(0, 200))}`);
  checks++;
  return response;
}

try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try { await fetch(base + '/admin/login'); break; } catch { if (attempt === 99) throw new Error('Server did not start.'); await delay(200); }
  }
  for (const route of ['/', '/about', '/rooms', '/room/deluxe', '/room/family', '/room/standard', '/amenities', '/gallery', '/contact', '/book-now', '/blog', '/admin/login']) await request(route);
  const initialPage = await request('/');
  const initialHtml = await initialPage.text();
  assert.match(initialPage.headers.get('cache-control'), /s-maxage=60/);
  assert.doesNotMatch(initialHtml, /fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com/);
  const initialHeader = /<header\b[\s\S]*?<\/header>/.exec(initialHtml)?.[0];
  const initialFooter = /<footer\b[\s\S]*?<\/footer>/.exec(initialHtml)?.[0];
  assert.match(initialHeader || '', /href="\/rooms"/, 'Main navigation must be available before browser data requests.');
  assert.match(initialFooter || '', /href="\/contact"/, 'Footer links must render in the initial page.');
  assert.match(initialHtml, /<link[^>]+rel="preload"[^>]+as="image"/, 'The selected hero must be preloaded.');
  const initialImages = [...initialHtml.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)];
  assert.ok(initialImages.length > 5);
  assert.ok(initialImages.every(image => !image[1].startsWith('/images/')), 'Homepage stock photos must use compressed responsive variants.');
  assert.match(initialHtml, /srcSet="[^"]+480w/, 'Homepage images must offer a small-screen variant.');
  assert.match(initialHtml, /aria-label="Check-in date"[^>]+type="date"/, 'Homepage booking fields must accept real dates.');
  const initialProps = JSON.parse(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(initialHtml)[1]).props.pageProps;
  assert.ok(initialProps.siteLayout?.header?.menu?.length && initialProps.siteImages?.hero, 'Homepage must supply its layout and selected images.');
  assert.ok(!initialProps.data?.about, 'Homepage props should not include every public page.');
  const homeScript = [...initialHtml.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]).find(src => /\/pages\/index-/.test(src));
  assert.ok(homeScript);
  const homeCode = await (await request(homeScript)).text();
  assert.doesNotMatch(homeCode, /\/data\/siteData\.json/, 'Homepage must not refetch the bundled local content after hydration.');
  const stylesheet = /href="([^"\s]+\.css)"/.exec(initialHtml)?.[1];
  assert.ok(stylesheet);
  const css = await (await request(stylesheet)).text();
  const font = /url\(["']?([^\s)"']+\.woff2)/.exec(css)?.[1];
  assert.ok(font, 'Website font files must be bundled locally.');
  const fontPath = new URL(font, base + stylesheet).pathname;
  await request(fontPath);
  for (const route of ['/room/missing-room', '/blog/missing-blog', '/authors/missing-author']) await request(route, { status: 404 });
  const adminPages = ['/admin', '/admin/rooms', '/admin/availability', '/admin/bookings', '/admin/expenses', '/admin/messages', '/admin/amenities', '/admin/blogs', '/admin/blogs/new', '/admin/authors', '/admin/authors/new'];
  for (const route of adminPages) await request(route, { status: 307 });
  await request('/admin/images', { status: 307 });
  await request('/api/admin/page?path=/admin/expenses', { status: 401 });
  await request('/api/admin/images', { status: 401 });
  await request('/api/admin/images/upload', { method: 'POST', status: 401 });
  await request('/api/admin/media?blog=missing', { status: 401 });
  for (const name of ['bookings', 'messages', 'expenses', 'rooms', 'authors', 'blogs']) await request(`/api/admin/${name}`, { status: 401 });
  await request('/api/admin/bookings', { status: 401, headers: { 'x-middleware-subrequest': 'middleware:middleware:middleware:middleware:middleware' } });
  await request('/api/bookings', { status: 405 });
  await request('/api/messages', { status: 405 });
  await request('/api/site-data?dataset=site');
  await request('/api/site-data?dataset=rooms');
  await request('/api/site-data?dataset=bookings', { status: 400 });
  await request('/api/site-data?dataset=rooms', { method: 'POST', body: {}, status: 405 });
  await request('/api/admin/login', { method: 'POST', body: { password: 'incorrect' }, status: 401 });
  const login = await request('/api/admin/login', { method: 'POST', body: { password } });
  const setCookie = login.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /Secure/);
  cookie = setCookie.split(';')[0];
  for (const route of adminPages) { await request(route, { admin: true }); const loaded = await request('/api/admin/page?path=' + encodeURIComponent(route), { admin: true }); assert.match(loaded.headers.get('server-timing'), /data;dur=/); }
  await request('/admin/images', { admin: true });
  const slots = (await (await request('/api/admin/images', { admin: true })).json()).slots;
  const hero = slots.find(slot => slot.id === 'site:images.hero');
  assert.ok(hero);
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: 'site:__proto__.polluted', value: '/images/test.webp' }, status: 400 });
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: hero.id, value: 'javascript:alert(1)' }, status: 400 });
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: hero.id, value: 'https://user:password@example.com/photo.jpg' }, status: 400 });
  await request('/api/admin/images/upload', { method: 'POST', admin: true, rawBody: 'invalid', headers: { 'Content-Type': 'image/png' }, status: 400 });
  await request('/api/admin/images/upload', { method: 'POST', admin: true, rawBody: '<svg/>', headers: { 'Content-Type': 'image/svg+xml' }, status: 400 });
  const photo = await sharp({ create: { width: 2200, height: 1100, channels: 3, background: '#036045' } }).png().toBuffer();
  const uploaded = await (await request('/api/admin/images/upload', { method: 'POST', admin: true, rawBody: photo, headers: { 'Content-Type': 'image/png' }, status: 201 })).json();
  assert.match(uploaded.url, /^\/api\/site-image\?id=[a-f0-9]{64}$/);
  const served = await request(uploaded.url);
  assert.match(served.headers.get('cache-control'), /immutable/);
  assert.equal(served.headers.get('content-type'), 'image/webp');
  const optimized = await sharp(Buffer.from(await served.arrayBuffer())).metadata();
  assert.equal(optimized.width, 1600);
  assert.equal(optimized.height, 800);
  assert.equal(optimized.exif, undefined);
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: hero.id, expectedHash: hero.expectedHash, value: uploaded.url } });
  const site = await (await request('/api/site-data?dataset=site')).json();
  assert.equal(site.images.hero, uploaded.url);
  assert.match(await (await request('/')).text(), new RegExp(uploaded.url.replace('?', '\\?')));
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: hero.id, expectedHash: hero.expectedHash, value: hero.value }, status: 409 });
  await request('/api/site-image?id=../../secret', { status: 404 });
  await request('/api/site-image?id=' + 'f'.repeat(64), { status: 404 });
  const roomSlot = slots.find(slot => slot.id === 'rooms:roomDetails.deluxe.images.0');
  assert.ok(roomSlot);
  await request('/api/admin/images', { method: 'PATCH', admin: true, body: { id: roomSlot.id, value: uploaded.url } });
  assert.match(await (await request('/room/deluxe')).text(), new RegExp(uploaded.url.replace('?', '\\?')));
  // Existing base64 photos must not bloat public page HTML or JSON responses.
  const roomFile = path.join(publicDirectory, 'roomsData.json');
  const legacyRooms = JSON.parse(await fs.readFile(roomFile, 'utf8'));
  legacyRooms.roomDetails.deluxe.images[0] = 'data:image/png;base64,' + photo.toString('base64');
  await fs.writeFile(roomFile, JSON.stringify(legacyRooms));
  await request('/api/admin/rooms', { method: 'POST', admin: true, body: legacyRooms });
  const publicRooms = await (await request('/api/site-data?dataset=rooms')).json();
  assert.match(publicRooms.roomDetails.deluxe.images[0], /^\/api\/media\?/);
  assert.ok(!(await (await request('/room/deluxe')).text()).includes('data:image/png;base64,'));
  await request(publicRooms.roomDetails.deluxe.images[0]);
  await request('/api/admin/expenses', { method: 'POST', admin: true, body: { expenses: [] }, headers: { Origin: 'https://example.com' }, status: 403 });

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const checkout = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const guest = { fullName: 'Regression Guest', phone: '+923001234567', email: 'regression@example.com' };
  const booking = { ...guest, checkIn: tomorrow, checkOut: checkout, guests: '2', roomType: 'Deluxe Room', roomSlug: 'deluxe', roomPrice: 'Rs 1' };
  await request('/api/bookings', { method: 'POST', body: {}, status: 400 });
  await request('/api/bookings', { method: 'POST', body: { ...booking, checkOut: tomorrow }, status: 400 });
  await request('/api/bookings', { method: 'POST', body: { ...booking, roomSlug: 'missing-room' }, status: 400 });
  const created = await (await request('/api/bookings', { method: 'POST', body: booking, status: 201 })).json();
  assert.notEqual(created.booking.roomPrice, booking.roomPrice);
  await Promise.all(Array.from({ length: 6 }, (_, index) => request(index % 2 ? '/api/admin/bookings' : '/api/bookings', { method: 'POST', admin: Boolean(index % 2), body: booking, status: 201 })));
  let stored = await (await request('/api/admin/bookings', { admin: true })).json();
  assert.equal(stored.bookings.length, 7);
  assert.equal(new Set(stored.bookings.map(b => b.id)).size, 7);
  await request('/api/admin/bookings', { method: 'PATCH', admin: true, body: { id: created.booking.id, status: 'Confirmed', payment: 'Paid', amount: 14000, notes: 'Updated request' } });
  stored = JSON.parse(await fs.readFile(path.join(directory, 'bookings.json'), 'utf8'));
  assert.equal(stored.bookings.find(b => b.id === created.booking.id).payment, 'Paid');
  assert.equal(stored.bookings.find(b => b.id === created.booking.id).notes, 'Updated request');
  await request('/api/admin/bookings', { method: 'PATCH', admin: true, body: { id: created.booking.id, status: 'Unknown' }, status: 400 });
  await request('/api/admin/bookings', { method: 'DELETE', admin: true, body: { id: created.booking.id } });
  assert.equal((await (await request('/api/admin/bookings', { admin: true })).json()).bookings.length, 6);

  await request('/api/messages', { method: 'POST', body: { ...guest, subject: 'Test inquiry', message: 'Message body persists.' }, status: 201 });
  await request('/api/messages', { method: 'POST', body: { ...guest, subject: 'Invalid', message: '' }, status: 400 });
  const messagesPage = await (await request('/api/admin/page?path=/admin/messages', { admin: true })).text();
  assert.match(messagesPage, /Message body persists/);
  await request('/api/admin/expenses', { method: 'POST', admin: true, body: { expenses: {} }, status: 400 });
  await request('/api/admin/expenses', { method: 'POST', admin: true, body: { expense: { id: 'test', title: 'Supplies', category: 'Rooms', amount: 500, date: tomorrow, paymentMethod: 'Cash', note: '' } } });
  assert.equal((await (await request('/api/admin/expenses', { admin: true })).json()).expenses[0].amount, 500);
  await request('/api/admin/rooms', { method: 'POST', admin: true, body: {}, status: 400 });
  const rooms = await (await request('/api/admin/rooms', { admin: true })).json();
  const beforeGallery = [...rooms.roomDetails.deluxe.images];
  const beforeImage = rooms.roomsPage.availableRooms[0].image;
  rooms.roomsPage.availableRooms[0].price = 'Rs 7,500 / night';
  // Check room uploads above the default body limit without touching real data.
  rooms.roomsPage.availableRooms[0].image = 'data:image/png;base64,' + 'a'.repeat(1100000);
  await request('/api/admin/rooms', { method: 'POST', admin: true, body: rooms });
  const savedRooms = await (await request('/api/admin/rooms', { admin: true })).json();
  assert.deepEqual(savedRooms.roomDetails.deluxe.images, beforeGallery);
  assert.equal(savedRooms.roomsPage.availableRooms[0].price, 'Rs 7,500 / night');
  assert.match(await (await request('/book-now')).text(), /7,500/);
  assert.match(await (await request('/room/deluxe')).text(), /7,500/);
  assert.match(await (await request('/api/site-data?dataset=rooms')).text(), /7,500/);
  assert.match(await (await request('/')).text(), /7,500/);
  savedRooms.roomsPage.availableRooms[0].image = beforeImage;
  await request('/api/admin/rooms', { method: 'POST', admin: true, body: savedRooms });

  const author = (await (await request('/api/admin/authors', { method: 'POST', admin: true, body: { name: 'Regression Author' } })).json()).author;
  await request('/api/admin/authors', { method: 'POST', admin: true, body: { name: 'Regression Author' }, status: 409 });
  const article = { title: 'Regression Article', authorId: author.id, status: 'Draft', blocks: [{ type: 'paragraph', text: 'Verified article content.' }] };
  const blog = (await (await request('/api/admin/blogs', { method: 'POST', admin: true, body: article })).json()).blog;
  await request(`/blog/${blog.slug}`, { status: 404 });
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, id: blog.id, status: 'Published' } });
  assert.match(await (await request(`/blog/${blog.slug}`)).text(), /Verified article content/);
  assert.match(await (await request(`/authors/${author.slug}`)).text(), /Regression Article/);
  await request(`/admin/blogs/edit?id=${blog.id}`, { admin: true });
  await request(`/admin/authors/edit?id=${author.id}`, { admin: true });
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: article, status: 409 });
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, title: 'Invalid author', authorId: 'missing' }, status: 400 });
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, title: 'Invalid link', blocks: [{ type: 'link', url: 'javascript:alert(1)' }] }, status: 400 });
  // The editors embed images in JSON. Verify a body above Next's default 1 MB.
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, id: blog.id, featuredImage: 'data:image/png;base64,' + 'a'.repeat(1100000) } });
  await request(`/api/media?blog=${blog.id}`, { status: 404 });
  const privatePreview = await request(`/api/admin/media?blog=${blog.id}`, { admin: true });
  assert.equal(privatePreview.headers.get('cache-control'), 'no-store');
  const authorList = await (await request('/api/admin/page?path=/admin/authors', { admin: true })).text();
  const blogList = await (await request('/api/admin/page?path=/admin/blogs', { admin: true })).text();
  assert.ok(authorList.length < 100000, 'Author lists should contain counts, not full articles or embedded photos.');
  assert.ok(blogList.length < 100000, 'Blog lists should contain summaries, not article bodies or embedded photos.');
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, id: blog.id, status: 'Published', featuredImage: 'data:image/png;base64,' + 'a'.repeat(1100000) } });
  const image = await request(`/api/media?blog=${blog.id}`);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok((await image.arrayBuffer()).byteLength > 800000);
  const homepage = await (await request('/')).text();
  assert.ok(homepage.length < 100000, 'Home page must not inline uploaded images or full article bodies.');
  await request('/api/admin/blogs', { method: 'DELETE', admin: true, body: { id: blog.id } });
  await request(`/blog/${blog.slug}`, { status: 404 });
  await request('/api/admin/authors', { method: 'DELETE', admin: true, body: { id: author.id } });
  await request(`/authors/${author.slug}`, { status: 404 });
  await request('/api/admin/logout', { method: 'POST', admin: true });
  console.log(`Passed ${checks} integration checks: routes, authentication, guest submissions, concurrent writes, booking changes, expenses, and blog/author publishing.`);
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  server.kill();
  if (server.exitCode === null) await once(server, 'exit');
  await fs.rm(directory, { recursive: true, force: true });
}
