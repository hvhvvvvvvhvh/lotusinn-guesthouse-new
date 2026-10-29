import fs from 'node:fs/promises';
const base = process.env.LOTUS_MEASURE_URL || 'https://lotusinn-guesthouse-new.vercel.app';
let cookie = '';
if (process.env.LOTUS_ADMIN_PASSWORD_FILE) {
  const password = (await fs.readFile(process.env.LOTUS_ADMIN_PASSWORD_FILE, 'utf8')).trim();
  const response = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ password }), signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Admin verification returned ${response.status}.`);
  cookie = response.headers.get('set-cookie').split(';')[0];
}
const rows = [];
const routes = ['/', '/rooms', '/blog', ...(cookie ? ['/admin/authors', '/admin/blogs', '/admin/rooms', '/admin/bookings', '/admin/images'] : [])];
for (const route of routes) for (let sample = 1; sample <= 2; sample++) {
  const start = performance.now();
  const response = await fetch(base + route, { headers: cookie ? { Cookie: cookie } : {}, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const ttfbMs = Math.round(performance.now() - start);
  const bytes = (await response.arrayBuffer()).byteLength;
  const row = { route, sample, status: response.status, ttfbMs, totalMs: Math.round(performance.now() - start), bytes, cache: response.headers.get('x-vercel-cache') || response.headers.get('x-nextjs-cache') || '' };
  rows.push(row); console.log(JSON.stringify(row));
}
if (cookie) await fetch(base + '/api/admin/logout', { method: 'POST', headers: { Cookie: cookie, Origin: base } });
if (process.env.LOTUS_METRICS_FILE) await fs.writeFile(process.env.LOTUS_METRICS_FILE, JSON.stringify(rows, null, 2));
