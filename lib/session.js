// Web Crypto works in both Next middleware and Node.
export const ADMIN_COOKIE = 'lotus_admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 12;

export function adminCredentials() {
  const local = process.env.NODE_ENV !== 'production';
  return {
    password: process.env.ADMIN_PASSWORD || (local ? 'LotusInn@2026!' : ''),
    secret: process.env.ADMIN_SESSION_SECRET || (local ? 'lotus-local-development-secret' : ''),
  };
}

async function signingKey() {
  const { password, secret } = adminCredentials();
  if (!password || !secret) return null;
  return crypto.subtle.importKey('raw', new TextEncoder().encode(`${password}:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSessionToken(now = Date.now()) {
  const key = await signingKey();
  if (!key) throw new Error('Admin credentials are not configured.');
  const payload = `${Math.floor(now / 1000) + SESSION_MAX_AGE}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('')}`;
}

export async function isValidSession(token, now = Date.now()) {
  if (typeof token !== 'string') return false;
  const match = /^(\d+)\.([a-f0-9-]{36})\.([a-f0-9]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(now / 1000)) return false;
  const key = await signingKey();
  if (!key) return false;
  const signature = Uint8Array.from(match[3].match(/.{2}/g), hex => parseInt(hex, 16));
  return crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${match[1]}.${match[2]}`));
}
