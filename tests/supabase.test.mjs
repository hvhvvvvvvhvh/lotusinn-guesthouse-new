import test from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseAdmin, storageDriver } from '../lib/supabaseClient.js';
import { updateSupabaseJson, readDocument } from '../lib/supabaseStore.js';
import http from 'node:http';
import { once } from 'node:events';
import { createClient } from '@supabase/supabase-js';

function database(initial) {
  const state = { data: initial, version: 1, conflicts: 0 };
  return { state, from() { return { select() { return { eq() { return { async maybeSingle() { return { data: structuredClone({ data: state.data, version: state.version }), error: null }; } }; } }; } }; }, async rpc(name, args) {
    assert.equal(name, 'lotus_compare_and_set');
    await new Promise(resolve => setTimeout(resolve, 2));
    if (args.p_expected_version !== state.version) { state.conflicts++; return { error: { code: 'PT409' } }; }
    state.data = structuredClone(args.p_data); state.version++;
    return { error: null };
  } };
}

test('parallel database updates retry stale versions without dropping guest records', async () => {
  const client = database({ bookings: [] });
  await Promise.all(Array.from({ length: 6 }, (_, id) => updateSupabaseJson('bookings', data => ({ bookings: [...data.bookings, { id }] }), client)));
  assert.equal(client.state.data.bookings.length, 6);
  assert.equal(new Set(client.state.data.bookings.map(item => item.id)).size, 6);
  assert.ok(client.state.conflicts > 0);
});

test('database failures do not masquerade as empty records or retry permission errors', async () => {
  const broken = { from() { return { select() { return { eq() { return { async maybeSingle() { return { data: null, error: { code: '42501' } }; } }; } }; } }; } };
  await assert.rejects(readDocument('bookings', broken), /42501/);
  const client = database({ bookings: [] });
  client.rpc = async () => ({ error: { code: '42501' } });
  await assert.rejects(updateSupabaseJson('bookings', data => data, client), /42501/);
  assert.equal(client.state.version, 1);
});

test('Supabase configuration rejects unknown storage drivers and browser publishable keys', () => {
  const original = { LOTUS_STORAGE_DRIVER: process.env.LOTUS_STORAGE_DRIVER, SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY };
  try {
    process.env.LOTUS_STORAGE_DRIVER = 'unknown';
    assert.throws(storageDriver, /must be/);
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'sb_publishable_test';
    assert.throws(getSupabaseAdmin, /not a publishable key/);
    process.env.SUPABASE_SECRET_KEY = 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url') + '.signature';
    assert.throws(getSupabaseAdmin, /not an anon key/);
  } finally { for (const [key, value] of Object.entries(original)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('the real Supabase SDK sends authenticated reads and versioned RPC writes correctly', async () => {
  let data = { messages: [] };
  let version = 1;
  const requests = [];
  const server = http.createServer(async (req, res) => {
    requests.push({ method: req.method, url: req.url, key: req.headers.apikey });
    res.setHeader('Content-Type', 'application/json');
    if (req.method === 'GET' && req.url.startsWith('/rest/v1/lotus_documents?')) {
      res.end(JSON.stringify([{ data, version }])); return;
    }
    if (req.method === 'POST' && req.url === '/rest/v1/rpc/lotus_compare_and_set') {
      let body = ''; for await (const chunk of req) body += chunk;
      const params = JSON.parse(body);
      if (params.p_key !== 'messages' || params.p_expected_version !== version) { res.statusCode = 409; res.end(JSON.stringify({ code: 'PT409', message: 'version_conflict' })); return; }
      data = params.p_data; version++;
      res.end(JSON.stringify(version)); return;
    }
    res.statusCode = 404; res.end('{}');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const client = createClient(`http://127.0.0.1:${server.address().port}`, 'sb_secret_test_only', { auth: { persistSession: false, autoRefreshToken: false } });
    await updateSupabaseJson('messages', row => ({ messages: [...row.messages, { id: 'guest-request' }] }), client);
    const saved = await readDocument('messages', client);
    assert.equal(saved.version, 2);
    assert.equal(saved.data.messages[0].id, 'guest-request');
    assert.ok(requests.every(req => req.key === 'sb_secret_test_only'));
    assert.equal(requests.filter(req => req.method === 'POST').length, 1);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
