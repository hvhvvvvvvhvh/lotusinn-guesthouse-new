import { setTimeout as delay } from 'node:timers/promises';
import { getSupabaseAdmin } from './supabaseClient.js';

const table = 'lotus_documents';

export async function readDocument(key, client = getSupabaseAdmin()) {
  const { data, error } = await client.from(table).select('data,version').eq('key', key).maybeSingle();
  if (error) throw new Error(`Unable to read ${key} from Supabase (${error.code || 'database error'}). Check the database schema and server key.`);
  return data;
}

export async function readSupabaseJson(key) {
  const document = await readDocument(key);
  if (!document) throw new Error(`Supabase dataset '${key}' is missing. Run npm run supabase:migrate first.`);
  return document.data;
}

// A version-checked Postgres transaction protects writes across serverless
// instances. A retry re-runs the updater against the newest committed data.
export async function updateSupabaseJson(key, update, client = getSupabaseAdmin()) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const document = await readDocument(key, client);
    if (!document) throw new Error(`Supabase dataset '${key}' is missing. Run the migration before accepting writes.`);
    const next = await update(document.data);
    const { error } = await client.rpc('lotus_compare_and_set', { p_key: key, p_data: next, p_expected_version: document.version });
    if (!error) return next;
    if (error.code !== 'PT409') throw new Error(`Unable to save ${key} to Supabase (${error.code || 'database error'}).`);
    await delay(10 * (attempt + 1) + Math.random() * 25);
  }
  throw Object.assign(new Error('The data changed during saving. Please try again.'), { status: 409 });
}
