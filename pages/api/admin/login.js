import { ADMIN_COOKIE, ADMIN_PASSWORD, createSessionToken, cookieOptions } from '../../../lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  const password = String(req.body?.password || '');
  if (!password) return res.status(400).json({ message: 'Please enter the admin password.' });
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ message: 'Incorrect admin password.' });

  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${createSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}${cookieOptions.secure ? '; Secure' : ''}`);
  return res.status(200).json({ success: true });
}
