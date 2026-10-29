import { getSupabaseAdmin } from '../lib/supabaseClient.js';
import { readDocument } from '../lib/supabaseStore.js';
import { listRecords, recordDatasets, adminTotals } from '../lib/recordStore.js';
import { localToday } from '../lib/booking.js';

const client = getSupabaseAdmin();
for (const key of ['site','rooms','bookings','messages','expenses','blogs','authors']) {
  if (recordDatasets.has(key)) {
    await listRecords(key, { limit: 1, fields: ['id'] });
    console.log(`${key}: row storage connected.`);
    continue;
  }
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
await adminTotals('dashboard', localToday());
console.log('Supabase row queries, aggregate functions and document version protection verified. No records were changed.');
