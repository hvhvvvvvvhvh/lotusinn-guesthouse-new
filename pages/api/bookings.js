import { createBooking } from '../../lib/guestRequests.js';
import { apiError } from '../../lib/validation.js';
import { checkRequestOrigin } from '../../lib/adminAuth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ message: 'Method not allowed.' }); }
  if (!checkRequestOrigin(req, res)) return;
  try { return res.status(201).json({ success: true, booking: await createBooking(req.body) }); }
  catch (error) { return apiError(res, error, 'Unable to save booking.'); }
}
