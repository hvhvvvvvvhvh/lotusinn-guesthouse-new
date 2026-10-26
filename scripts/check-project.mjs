import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';

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
  env: { ...process.env, NODE_ENV: 'production', LOTUS_STORAGE_DRIVER: 'json', ADMIN_PASSWORD: password, ADMIN_SESSION_SECRET: crypto.randomUUID(), LOTUS_DATA_DIR: directory, LOTUS_PUBLIC_DATA_DIR: publicDirectory },
  stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
});
let logs = '';
server.stdout.on('data', data => { logs = (logs + data).slice(-12000); });
server.stderr.on('data', data => { logs = (logs + data).slice(-12000); });
const base = `http://127.0.0.1:${port}`;
let cookie = '';
let checks = 0;
async function request(url, { method = 'GET', body, admin = false, headers = {}, status = 200 } = {}) {
  const response = await fetch(base + url, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(admin ? { Cookie: cookie } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'manual' });
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
  for (const route of ['/room/missing-room', '/blog/missing-blog', '/authors/missing-author']) await request(route, { status: 404 });
  const adminPages = ['/admin', '/admin/rooms', '/admin/availability', '/admin/bookings', '/admin/expenses', '/admin/messages', '/admin/amenities', '/admin/blogs', '/admin/blogs/new', '/admin/authors', '/admin/authors/new'];
  for (const route of adminPages) await request(route, { status: 307 });
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
  for (const route of adminPages) await request(route, { admin: true });
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
  const messagesPage = await (await request('/admin/messages', { admin: true })).text();
  assert.match(messagesPage, /Message body persists/);
  await request('/api/admin/expenses', { method: 'POST', admin: true, body: { expenses: {} }, status: 400 });
  await request('/api/admin/expenses', { method: 'POST', admin: true, body: { expenses: [{ id: 'test', title: 'Supplies', category: 'Rooms', amount: 500, date: tomorrow, paymentMethod: 'Cash', note: '' }] } });
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
  await request('/api/admin/blogs', { method: 'POST', admin: true, body: { ...article, id: blog.id, status: 'Published', featuredImage: 'data:image/png;base64,' + 'a'.repeat(1100000) } });
  const image = await request(`/api/media?blog=${blog.id}`);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok((await image.arrayBuffer()).byteLength > 800000);
  const homepage = await (await request('/')).text();
  assert.ok(homepage.length < 100000, 'Home page must not inline uploaded images or full article bodies.');
  await request('/api/admin/blogs', { method: 'DELETE', admin: true, body: { id: blog.id } });
  await request('/api/admin/authors', { method: 'DELETE', admin: true, body: { id: author.id } });
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
