import test from 'node:test';
import assert from 'node:assert/strict';
import { cachedAdminPage, loadAdminPage, clearAdminCache, adminRequest } from '../lib/adminClient.js';

test('admin reads deduplicate and successful writes invalidate cached private data', async () => {
  const saved = { window: globalThis.window, fetch: globalThis.fetch };
  let requests = 0;
  globalThis.window = { location: { origin: 'http://localhost', replace() {} } };
  globalThis.fetch = async () => { requests++; return { ok: true, status: 200, json: async () => ({ items: ['private'] }) }; };
  try {
    clearAdminCache();
    await Promise.all([loadAdminPage('/admin/expenses'), loadAdminPage('/admin/expenses')]);
    assert.equal(requests, 1);
    await loadAdminPage('/admin/expenses');
    assert.equal(requests, 1);
    await adminRequest('/api/admin/expenses', { method: 'POST' });
    assert.equal(cachedAdminPage('/admin/expenses'), null);
    await loadAdminPage('/admin/expenses');
    assert.equal(requests, 3);
  } finally { clearAdminCache(); Object.assign(globalThis, saved); }
});

test('a read started before logout or a write cannot repopulate private cache', async () => {
  const saved = { window: globalThis.window, fetch: globalThis.fetch };
  let resolve;
  globalThis.window = { location: { origin: 'http://localhost', replace() {} } };
  globalThis.fetch = () => new Promise(done => { resolve = done; });
  try {
    const pending = loadAdminPage('/admin/messages');
    clearAdminCache();
    resolve({ ok: true, status: 200, json: async () => ({ items: ['old'] }) });
    await pending;
    assert.equal(cachedAdminPage('/admin/messages'), null);
  } finally { clearAdminCache(); Object.assign(globalThis, saved); }
});

test('expired sessions clear all cached data and return to login', async () => {
  const saved = { window: globalThis.window, fetch: globalThis.fetch };
  let redirected;
  globalThis.window = { location: { origin: 'http://localhost', replace(url) { redirected = url; } } };
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  try {
    await assert.rejects(loadAdminPage('/admin/bookings'), /session expired/i);
    assert.match(redirected, /^\/admin\/login\?next=/);
    assert.equal(cachedAdminPage('/admin/bookings'), null);
  } finally { clearAdminCache(); Object.assign(globalThis, saved); }
});
