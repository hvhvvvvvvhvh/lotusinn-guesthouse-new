const pages = new Map();
const pending = new Map();
const ttl = 30000;
let revision = 0;
let channel;

export function clearAdminCache(broadcast = true) {
  revision++;
  pages.clear();
  pending.clear();
  if (broadcast) channel?.postMessage('invalidate');
}
export function connectAdminCache() {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('lotus-admin-cache');
    channel.onmessage = () => clearAdminCache(false);
  }
  const clear = () => clearAdminCache(false);
  window.addEventListener('pagehide', clear);
  return () => { clear(); channel?.close(); channel = undefined; window.removeEventListener('pagehide', clear); };
}
export function cachedAdminPage(key) {
  const entry = pages.get(key);
  if (!entry || entry.expires <= Date.now()) { pages.delete(key); return null; }
  return entry.data;
}
export async function loadAdminPage(key) {
  const cached = cachedAdminPage(key);
  if (cached) return cached;
  if (pending.has(key)) return pending.get(key);
  const requestRevision = revision;
  const url = new URL(key, window.location.origin);
  const params = new URLSearchParams(url.search);
  params.set('path', url.pathname);
  const request = fetch(`/api/admin/page?${params}`, { cache: 'no-store', credentials: 'same-origin' }).then(async response => {
    if (response.status === 401) {
      clearAdminCache();
      window.location.replace(`/admin/login?next=${encodeURIComponent(key)}`);
      throw new Error('Your session expired. Please sign in again.');
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to load this page.');
    // An in-flight read must never repopulate the cache after a save/logout.
    if (revision === requestRevision) {
      if (pages.size >= 20) pages.delete(pages.keys().next().value);
      pages.set(key, { data, expires: Date.now() + ttl });
    }
    return data;
  }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
  pending.set(key, request);
  return request;
}
export async function adminRequest(url, options = {}) {
  const response = await fetch(url, { ...options, credentials: 'same-origin', cache: 'no-store' });
  if (response.status === 401) clearAdminCache();
  if (!['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase()) && response.ok) clearAdminCache();
  return response;
}
