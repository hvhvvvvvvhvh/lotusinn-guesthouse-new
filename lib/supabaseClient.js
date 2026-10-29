import { createClient } from '@supabase/supabase-js';
const clientKey = Symbol.for('lotus.supabaseClient');

export function storageDriver() {
  const driver = process.env.LOTUS_STORAGE_DRIVER || 'json';
  if (!['json', 'supabase'].includes(driver)) throw new Error('LOTUS_STORAGE_DRIVER must be json or supabase.');
  return driver;
}

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') throw new Error('Database access is only available on the server.');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY in the server environment.');
  if (key.startsWith('sb_publishable_')) throw new Error('Use a server secret key, not a publishable key.');
  if (key.startsWith('eyJ')) {
    let role;
    try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role; } catch {}
    if (role !== 'service_role') throw new Error('Use a server secret or service_role key, not an anon key.');
  }
  const existing = globalThis[clientKey];
  if (existing?.url === url && existing?.key === key) return existing.client;
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, options = {}) => fetch(input, { ...options, signal: options.signal || AbortSignal.timeout(15000) }) },
  });
  globalThis[clientKey] = { url, key, client };
  return client;
}

