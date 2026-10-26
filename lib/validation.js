export function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

export function text(value, label, { required = false, max = 1000 } = {}) {
  if (value == null && !required) return '';
  if (typeof value !== 'string') invalid(`${label} must be text.`);
  const result = value.trim();
  if (required && !result) invalid(`${label} is required.`);
  if (result.length > max) invalid(`${label} is too long.`);
  return result;
}

export function dateOnly(value, label) {
  const result = text(value, label, { required: true, max: 10 });
  const parsed = new Date(`${result}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) invalid(`${label} must be a valid date.`);
  return result;
}

export function contactFields(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Invalid request body.');
  const result = {
    fullName: text(body.fullName, 'Full name', { required: true, max: 120 }),
    phone: text(body.phone, 'Phone', { required: true, max: 40 }),
    email: text(body.email, 'Email', { required: true, max: 254 }),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) invalid('Enter a valid email address.');
  if (!/^[+\d\s().-]{6,40}$/.test(result.phone)) invalid('Enter a valid phone number.');
  return result;
}

export function bookingFields(body) {
  const result = {
    ...contactFields(body),
    checkIn: dateOnly(body.checkIn, 'Check-in'),
    checkOut: dateOnly(body.checkOut, 'Check-out'),
    roomType: text(body.roomType, 'Room type', { required: true, max: 150 }),
    roomSlug: text(body.roomSlug, 'Room slug', { max: 90 }),
    guests: Number(body.guests),
    notes: text(body.notes ?? body.specialRequests, 'Special requests', { max: 5000 }),
  };
  if (result.checkOut <= result.checkIn) invalid('Check-out must be later than check-in.');
  if (!Number.isInteger(result.guests) || result.guests < 1 || result.guests > 50) invalid('Guests must be a whole number between 1 and 50.');
  return result;
}

export function apiError(res, error, message) {
  if (!error.status) console.error(message, error);
  return res.status(error.status || 500).json({ message: error.status ? error.message : message });
}
