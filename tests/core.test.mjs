import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createSessionToken, isValidSession, SESSION_MAX_AGE } from '../lib/session.js';
import { requireAdminApi, requireAdminPage } from '../lib/adminAuth.js';
import { writeJson, readJson, updateJson } from '../lib/dataStore.js';
import { bookingFields, dateOnly } from '../lib/validation.js';
import { bookingAmount, occupiesRoom } from '../lib/booking.js';
import { safeUrl, validateBlocks } from '../lib/contentValidation.js';
import { publicBlog } from '../lib/publicContent.js';

test('admin sessions are unique, signed, tamper resistant and expire', async () => {
  const now = Date.now();
  const token = await createSessionToken(now);
  assert.equal(await isValidSession(token, now), true);
  assert.notEqual(token, await createSessionToken(now));
  assert.equal(await isValidSession(token, now + SESSION_MAX_AGE * 1000), false);
  assert.equal(await isValidSession(`${token.slice(0, -1)}${token.endsWith('0') ? '1' : '0'}`, now), false);
  assert.equal(await isValidSession('old-static-token'), false);
});

test('production admin access fails closed without configured secrets', async () => {
  const saved = { NODE_ENV: process.env.NODE_ENV, ADMIN_PASSWORD: process.env.ADMIN_PASSWORD, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET };
  try {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    await assert.rejects(createSessionToken(), /not configured/);
    assert.equal(await isValidSession('anything'), false);
  } finally {
    for (const [key, value] of Object.entries(saved)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
}

test('API and server-rendered pages enforce auth without middleware', async () => {
  const res = response();
  assert.equal(await requireAdminApi({ method: 'GET', cookies: {}, headers: {} }, res), false);
  assert.equal(res.code, 401);
  const context = { req: { cookies: {} }, res: response(), resolvedUrl: '/admin/blogs/edit?id=123' };
  const denied = await requireAdminPage(context);
  assert.equal(denied.redirect.destination, '/admin/login?next=%2Fadmin%2Fblogs%2Fedit%3Fid%3D123');
  const token = await createSessionToken();
  const crossOrigin = response();
  assert.equal(await requireAdminApi({ method: 'POST', cookies: { lotus_admin_session: token }, headers: { host: 'localhost:3000', origin: 'https://example.com' } }, crossOrigin), false);
  assert.equal(crossOrigin.code, 403);
});

test('concurrent JSON updates do not lose records or corrupt files', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'lotus-store-'));
  const file = path.join(directory, 'data.json');
  try {
    await writeJson(file, { ids: [] });
    await Promise.all(Array.from({ length: 30 }, (_, id) => updateJson(file, data => ({ ids: [...data.ids, id] }))));
    assert.equal((await readJson(file)).ids.length, 30);
    await assert.rejects(updateJson(file, () => { throw new Error('rejected'); }));
    await updateJson(file, data => ({ ids: [...data.ids, 30] }));
    assert.equal((await readJson(file)).ids.length, 31);
    assert.deepEqual(await fs.readdir(directory), ['data.json']);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('booking validation rejects impossible dates, invalid guests and wrong types', () => {
  const booking = { fullName: 'Guest', phone: '+923001234567', email: 'guest@example.com', checkIn: '2026-11-01', checkOut: '2026-11-03', roomType: 'Deluxe Room', guests: '2' };
  assert.equal(bookingFields(booking).guests, 2);
  assert.throws(() => dateOnly('2026-02-30', 'Date'), /valid date/);
  assert.throws(() => bookingFields({ ...booking, checkOut: booking.checkIn }), /later/);
  assert.throws(() => bookingFields({ ...booking, guests: -1 }), /Guests/);
  assert.throws(() => bookingFields({ ...booking, fullName: {} }), /text/);
  assert.throws(() => bookingFields({ ...booking, email: 'invalid' }), /email/);
});

test('availability uses exact room identity and current stay dates', () => {
  const room = { slug: 'deluxe', title: 'Deluxe Room' };
  const booking = { roomSlug: 'deluxe', checkIn: '2026-10-25', checkOut: '2026-10-27', status: 'Confirmed' };
  assert.equal(occupiesRoom(booking, room, '2026-10-26'), true);
  assert.equal(occupiesRoom(booking, room, '2026-10-27'), false);
  assert.equal(occupiesRoom(booking, room, '2026-10-24'), false);
  assert.equal(occupiesRoom({ ...booking, status: 'Cancelled' }, room, '2026-10-26'), false);
  assert.equal(occupiesRoom({ ...booking, roomSlug: '', roomType: 'Deluxe Family Room' }, room, '2026-10-26'), false);
  assert.equal(bookingAmount({ ...booking, roomPrice: 'Rs 7,000 / night' }), 14000);
  assert.equal(bookingAmount({ ...booking, amount: 0, roomPrice: 'Rs 7,000 / night' }), 0);
});

test('CMS content rejects executable links and malformed blocks', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('//evil.example'), '');
  assert.equal(safeUrl('/rooms'), '/rooms');
  assert.equal(safeUrl('https://example.com'), 'https://example.com');
  assert.throws(() => validateBlocks([{ type: 'link', url: 'javascript:alert(1)' }]), /URL/);
  assert.throws(() => validateBlocks([{ type: 'bullet', items: [{}] }]), /text/);
  assert.equal(validateBlocks([{ type: 'paragraph', text: 'Article' }])[0].text, 'Article');
});

test('public article summaries exclude full bodies and inline image payloads', () => {
  const blog = { id: 'article', title: 'Article', updatedAt: 'version', featuredImage: 'data:image/png;base64,AAAA', blocks: [{ type: 'image', url: 'data:image/png;base64,AAAA' }, { type: 'paragraph', text: 'Body' }] };
  const summary = publicBlog(blog);
  assert.equal(summary.blocks, undefined);
  assert.match(summary.featuredImage, /^\/api\/media\?blog=article/);
  const detail = publicBlog(blog, true);
  assert.match(detail.blocks[0].url, /block=0/);
  assert.equal(detail.blocks[1].text, 'Body');
});
