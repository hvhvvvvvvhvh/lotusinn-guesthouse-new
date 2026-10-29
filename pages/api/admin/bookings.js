import { filePaths, readJson } from '../../../lib/dataStore.js';
import { requireAdminApi } from '../../../lib/adminAuth.js';
import { createBooking } from '../../../lib/guestRequests.js';
import { bookingFields, apiError, invalid } from '../../../lib/validation.js';
import { bookingStatuses, paymentStatuses } from '../../../lib/booking.js';
import { getRecord, mutateRecord } from '../../../lib/recordStore.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res)) return;
  try {
  if (req.method === 'GET') {
    const data = await readJson(filePaths.bookings);
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    return res.status(201).json({ success: true, booking: await createBooking(req.body) });
  }
  if (req.method === 'PATCH' || req.method === 'DELETE') {
    const id = req.body?.id;
    if (typeof id !== 'string' || !id) invalid('Booking id is required.');
      const current = await getRecord('bookings', id);
      if (!current) throw Object.assign(new Error('Booking not found.'), { status: 404 });
      if (req.method === 'DELETE') { await mutateRecord('bookings', id, 'delete'); return res.status(200).json({ success: true, booking: null }); }
      const merged = { ...current, ...req.body };
      const fields = bookingFields(merged);
      if (!bookingStatuses.includes(merged.status) || !paymentStatuses.includes(merged.payment)) invalid('Invalid booking or payment status.');
      const amount = merged.amount == null ? undefined : Number(merged.amount);
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) invalid('Amount must be a positive number or zero.');
      const updated = { ...current, ...fields, status: merged.status, payment: merged.payment, ...(amount !== undefined ? { amount } : {}), updatedAt: new Date().toISOString() };
    const result = await mutateRecord('bookings', id, 'patch', updated);
    return res.status(200).json({ success: true, booking: result.record });
  }
  res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
  return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) { return apiError(res, error, 'Unable to process booking request.'); }
}
