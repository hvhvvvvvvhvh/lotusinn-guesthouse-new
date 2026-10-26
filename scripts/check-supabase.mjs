import { getSupabaseAdmin } from '../lib/supabaseClient.js';
import { readDocument } from '../lib/supabaseStore.js';

const client = getSupabaseAdmin();
for (const key of ['site','rooms','bookings','messages','expenses','blogs','authors']) {
  const row = await readDocument(key, client);
  if (!row) throw new Error(`Missing dataset: ${key}. Run npm run supabase:migrate.`);
  if (key === 'site' && !row.data.layout) throw new Error('Site configuration is incomplete.');
  if (key === 'rooms' && !row.data.roomsPage) throw new Error('Room configuration is incomplete.');
  if (!['site','rooms'].includes(key) && !Array.isArray(row.data[key])) throw new Error(`Invalid dataset: ${key}.`);
  console.log(`${key}: connected (version ${row.version}${Array.isArray(row.data[key]) ? `, ${row.data[key].length} records` : ''}).`);
}
// Reject a stale version and prove the RPC is installed without changing data.
const row = await readDocument('site', client);
const stale = await client.rpc('lotus_compare_and_set', { p_key: 'site', p_data: row.data, p_expected_version: -1 });
if (stale.error?.code !== 'PT409') throw new Error('Version-check function is missing or did not reject a stale write.');
console.log('Supabase connection and concurrent-write protection verified. No records were changed.');
