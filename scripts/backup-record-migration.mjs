import fs from 'node:fs/promises';
import path from 'node:path';
import { getSupabaseAdmin } from '../lib/supabaseClient.js';
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory)) throw new Error('Provide an absolute backup directory.');
const { data, error } = await getSupabaseAdmin().from('lotus_documents').select('key,data,version');
if (error) throw new Error('Unable to back up documents.');
for (const document of data) {
  if (!['blogs','authors','bookings','messages','expenses'].includes(document.key)) continue;
  const items = document.data[document.key] || [];
  if (new Set(items.map(item => item.id)).size !== items.length || items.some(item => !item.id)) throw new Error(`Invalid identifiers in ${document.key}.`);
}
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(path.join(directory, `documents-${Date.now()}.json`), JSON.stringify(data), { flag: 'wx' });
console.log('Document backup saved; all collection identifiers validated. No record values printed.');
