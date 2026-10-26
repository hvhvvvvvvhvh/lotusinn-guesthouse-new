import fs from 'node:fs/promises';
import path from 'node:path';
import { getSupabaseAdmin } from '../lib/supabaseClient.js';

const client = getSupabaseAdmin();
const privateRoot = process.env.LOTUS_DATA_DIR || path.join(process.cwd(), 'data');
const publicRoot = process.env.LOTUS_PUBLIC_DATA_DIR || path.join(process.cwd(), 'public', 'data');
const sources = { site: path.join(publicRoot, 'siteData.json'), rooms: path.join(publicRoot, 'roomsData.json'), ...Object.fromEntries(['bookings','messages','expenses','blogs','authors'].map(key => [key, path.join(privateRoot, `${key}.json`)])) };

async function legacyRecords(key) {
  const table = key === 'blogs' ? 'lotus_blog_posts' : 'lotus_blog_authors';
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from(table).select('*').order('id').range(offset, offset + 499);
    if (error) {
      if (['PGRST205','42P01'].includes(error.code)) return [];
      throw new Error(`Could not inspect the existing ${table} table (${error.code}). No legacy data was changed.`);
    }
    rows.push(...data);
    if (data.length < 500) break;
  }
  return rows.map(row => {
    if (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) return row.data;
    if (key === 'authors') return { id: row.id, name: row.name, slug: row.slug || String(row.name || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''), role: row.role || '', shortBio: row.bio || '', biography: row.biography || '', image: row.avatar || '', email: row.email || '', expertise: row.expertise || [], createdAt: row.created_at, updatedAt: row.updated_at || row.created_at };
    return { id: row.id, title: row.title, slug: row.slug, authorId: row.author_id, category: row.category || '', status: row.status || 'Draft', publishDate: row.publish_date || '', excerpt: row.excerpt || '', metaTitle: row.meta_title || '', metaDescription: row.meta_description || '', keywords: row.keywords || '', featuredImage: row.featured_image || '', blocks: row.blocks || [], createdAt: row.created_at, updatedAt: row.updated_at || row.created_at };
  });
}

for (const [key, file] of Object.entries(sources)) {
  const existing = await client.from('lotus_documents').select('key').eq('key', key).maybeSingle();
  if (existing.error) throw new Error(`Database setup is missing or inaccessible (${existing.error.code}). Run supabase/migrations/202610260001_lotus_storage.sql first.`);
  if (existing.data) { console.log(`${key}: already present; left unchanged.`); continue; }
  let data = JSON.parse(await fs.readFile(file, 'utf8'));
  if (['blogs','authors'].includes(key)) {
    const legacy = await legacyRecords(key);
    const records = new Map((Array.isArray(data) ? data : data[key] || []).map(item => [String(item.id), item]));
    for (const item of legacy) records.set(String(item.id), item); // Existing database records take precedence.
    data = { [key]: Array.from(records.values()) };
    console.log(`${key}: preserving ${legacy.length} existing legacy database records.`);
  }
  const { error } = await client.from('lotus_documents').insert({ key, data });
  if (error && error.code !== '23505') throw new Error(`Migration failed for ${key} (${error.code}).`);
  console.log(`${key}: ${error ? 'created by another migration; left unchanged' : 'imported'}.`);
}
console.log('Migration complete. Existing database documents and local source files were not overwritten.');
