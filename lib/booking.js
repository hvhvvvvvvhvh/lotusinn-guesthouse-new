export const bookingStatuses = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'];
export const paymentStatuses = ['Unpaid', 'Partial', 'Paid'];

export function localToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function bookingAmount(booking) {
  if (booking.amount != null) return Number(booking.amount) || 0;
  const nightly = Number(String(booking.roomPrice || '').replace(/[^\d.]/g, '')) || 0;
  const nights = Math.max(0, (new Date(booking.checkOut) - new Date(booking.checkIn)) / 86400000) || 0;
  return nightly * nights;
}

export function occupiesRoom(booking, room, today = localToday()) {
  if (!['Pending', 'Confirmed', 'Checked In'].includes(booking.status || 'Pending')) return false;
  if (!(booking.checkIn <= today && booking.checkOut > today)) return false;
  if (booking.roomSlug) return booking.roomSlug === room.slug;
  return String(booking.roomType || '').trim().toLowerCase() === String(room.title || '').trim().toLowerCase();
}
