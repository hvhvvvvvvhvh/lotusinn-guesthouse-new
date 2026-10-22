import crypto from 'crypto';

export const ADMIN_COOKIE = 'lotus_admin_session';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LotusInn@2026!';
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'lotus-inn-admin-session-secret-change-me';

export function createSessionToken() {
  return crypto.createHash('sha256').update(`${ADMIN_PASSWORD}:${SESSION_SECRET}`).digest('hex');
}

export function isValidSession(token) {
  if (!token) return false;
  const expected = createSessionToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12,
};
