import { getSupabaseAdmin, storageDriver } from './supabaseClient.js';

export const recordDatasets = new Set(['bookings', 'messages', 'expenses', 'blogs', 'authors']);
function databaseError(error) {
  return Object.assign(new Error(error.code === '23505' ? 'That identifier or slug is already in use.' : error.message || 'Unable to access records.'),
    { status: error.code === '23505' || error.code === 'PT409' ? 409 : error.code === 'PT404' ? 404 : 500 });
}
export async function listRecords(dataset, { limit, offset = 0, fields, id, slug, status, activeOn, search, authorId } = {}) {
  if (!recordDatasets.has(dataset)) throw new Error('Unknown record dataset.');
  if (storageDriver() === 'json') {
    const { readJson, filePaths } = await import('./dataStore.js');
    let items = (await readJson(filePaths[dataset]))[dataset] || [];
    if (id) items = items.filter(item => item.id === id);
    if (slug) items = items.filter(item => item.slug === slug);
    if (status) items = items.filter(item => item.status === status);
    if (authorId) items = items.filter(item => item.authorId === authorId);
    if (activeOn) items = items.filter(item => ['Pending', 'Confirmed', 'Checked In'].includes(item.status || 'Pending') && item.checkIn <= activeOn && item.checkOut > activeOn);
    if (search) items = items.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
    const total = items.length;
    items = items.slice(offset, limit ? offset + limit : undefined);
    if (fields) items = items.map(item => Object.fromEntries(fields.map(key => [key, item[key] ?? ''])));
    return { items, total };
  }
  // Field names come only from application constants, never a request parameter.
  const projection = fields ? fields.map(field => `${field}:data->${field}`).join(',') : 'data';
  let query = getSupabaseAdmin().from('lotus_records').select(projection, { count: 'exact' }).eq('dataset', dataset).order('position', { ascending: false }).order('id');
  if (id) query = query.eq('id', id);
  if (slug) query = query.eq('data->>slug', slug);
  if (status) query = query.eq('data->>status', status);
  if (authorId) query = query.eq('data->>authorId', authorId);
  if (activeOn) query = query.in('data->>status', ['Pending', 'Confirmed', 'Checked In']).lte('data->>checkIn', activeOn).gt('data->>checkOut', activeOn);
  if (search) query = query.ilike('search_text', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
  if (limit) query = query.range(offset, offset + limit - 1);
  const { data, count, error } = await query;
  if (error) throw databaseError(error);
  return { items: fields ? data : data.map(row => row.data), total: count };
}
export async function allRecords(dataset, options = {}) {
  // PostgREST caps responses: page explicitly so exports/public generation cannot silently truncate.
  const items = [];
  for (let offset = 0; ; offset += 500) {
    const page = await listRecords(dataset, { ...options, offset, limit: 500 });
    items.push(...page.items);
    if (items.length >= page.total || !page.items.length) return items;
  }
}
export async function getRecord(dataset, id) {
  if (typeof id !== 'string' || !id.trim()) return null;
  return (await listRecords(dataset, { id, limit: 1 })).items[0] || null;
}
export async function mutateRecord(dataset, id, operation, record = {}, version = null) {
  if (!recordDatasets.has(dataset)) throw new Error('Unknown record dataset.');
  if (storageDriver() === 'supabase') {
    const { data, error } = await getSupabaseAdmin().rpc('lotus_mutate_record', { p_dataset: dataset, p_id: id, p_operation: operation, p_data: record, p_version: version });
    if (error) throw databaseError(error);
    return data;
  }
  const { updateJson, filePaths } = await import('./dataStore.js');
  let result;
  await updateJson(filePaths[dataset], document => {
    const items = document?.[dataset] || [];
    const previous = items.find(item => item.id === id) || null;
    if (operation === 'insert' && previous) throw Object.assign(new Error('Record already exists.'), { status: 409 });
    if (operation === 'patch' && !previous) throw Object.assign(new Error('Record not found.'), { status: 404 });
    const next = operation === 'delete' ? null : { ...(operation === 'patch' ? previous : {}), ...record, id, ...(previous?.createdAt ? { createdAt: previous.createdAt } : {}) };
    if (next?.slug && items.some(item => item.id !== id && item.slug === next.slug)) throw Object.assign(new Error('That slug is already in use.'), { status: 409 });
    result = { record: next, previous };
    return { [dataset]: !next ? items.filter(item => item.id !== id) : previous ? items.map(item => item.id === id ? next : item) : [next, ...items] };
  });
  return result;
}
export async function adminTotals(dataset, today) {
  if (storageDriver() === 'supabase') {
    const { data, error } = await getSupabaseAdmin().rpc('lotus_admin_totals', { p_dataset: dataset, p_today: today });
    if (error) throw databaseError(error);
    return data;
  }
  if (dataset === 'authors') return (await allRecords('blogs', { fields: ['authorId'] })).reduce((counts, blog) => ({ ...counts, [blog.authorId]: (counts[blog.authorId] || 0) + 1 }), {});
  if (dataset === 'expenses') return (await allRecords('expenses')).reduce((totals, item) => {
    totals.total += Number(item.amount || 0);
    const key = String(item.category).toLowerCase();
    if (['kitchen', 'fuel', 'staff'].includes(key)) totals[key] += Number(item.amount || 0);
    return totals;
  }, { total: 0, kitchen: 0, fuel: 0, staff: 0 });
  return null;
}
