import crypto from 'node:crypto';
import { ADMIN_COOKIE, adminCredentials, createSessionToken, cookieOptions, checkRequestOrigin } from '../../../lib/adminAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  res.setHeader('Cache-Control', 'no-store');
  if (!checkRequestOrigin(req, res)) return;
  const { password: expectedPassword, secret } = adminCredentials();
  if (!expectedPassword || !secret) return res.status(503).json({ message: 'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before signing in.' });
  const password = String(req.body?.password || '');
  if (!password) return res.status(400).json({ message: 'Please enter the admin password.' });
  const digest = value => crypto.createHash('sha256').update(value).digest();
  if (!crypto.timingSafeEqual(digest(password), digest(expectedPassword))) return res.status(401).json({ message: 'Incorrect admin password.' });

  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${await createSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}${cookieOptions.secure ? '; Secure' : ''}`);
  return res.status(200).json({ success: true });
}
