import { ADMIN_COOKIE, SESSION_MAX_AGE, isValidSession } from './session.js';
export { ADMIN_COOKIE, createSessionToken, isValidSession, adminCredentials } from './session.js';

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export function checkRequestOrigin(req, res) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.headers.origin) return true;
  try {
    if (new URL(req.headers.origin).host === req.headers.host) return true;
  } catch {}
  res.status(403).json({ message: 'Request origin is not allowed.' });
  return false;
}

export async function requireAdminApi(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!await isValidSession(req.cookies?.[ADMIN_COOKIE])) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return false;
  }
  return checkRequestOrigin(req, res);
}

export async function requireAdminPage(context) {
  context.res.setHeader('Cache-Control', 'no-store');
  if (await isValidSession(context.req.cookies?.[ADMIN_COOKIE])) return null;
  return { redirect: { destination: `/admin/login?next=${encodeURIComponent(context.resolvedUrl || '/admin')}`, permanent: false } };
}
