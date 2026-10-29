import assert from 'node:assert/strict';
import { getSupabaseAdmin } from '../lib/supabaseClient.js';
import { allRecords, adminTotals } from '../lib/recordStore.js';
import { bookingAmount, localToday } from '../lib/booking.js';
const client = getSupabaseAdmin();
const { data, error } = await client.from('lotus_documents').select('key,data');
assert.ifError(error);
for (const dataset of ['bookings', 'messages', 'expenses', 'blogs', 'authors']) {
  const original = data.find(row => row.key === dataset).data[dataset];
  const records = await allRecords(dataset);
  assert.deepEqual(records, original, `${dataset}: migration must preserve every value and ordering`);
}
const bookings = await allRecords('bookings');
const totals = await adminTotals('dashboard', localToday());
assert.equal(totals.activeBookings, bookings.length);
assert.equal(totals.monthlyIncome, bookings.filter(item => !['Cancelled', 'No Show'].includes(item.status)).reduce((sum, item) => sum + bookingAmount(item), 0));
const expenses = await allRecords('expenses');
assert.equal((await adminTotals('expenses', localToday())).total, expenses.reduce((sum, item) => sum + Number(item.amount), 0));
console.log('Verified every migrated value and record order across all five collections; database aggregates match application totals. No private values printed.');
