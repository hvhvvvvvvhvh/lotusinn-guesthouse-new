import { randomUUID } from 'node:crypto';
import { filePaths, readJson, updateJson } from './dataStore.js';
import { bookingFields, contactFields, text, invalid } from './validation.js';
import { localToday } from './booking.js';

export async function createBooking(body) {
  const fields = bookingFields(body);
  if (fields.checkIn < localToday()) invalid('Check-in cannot be in the past.');
  const rooms = await readJson(filePaths.rooms);
  const room = rooms.roomsPage.availableRooms.find(item => fields.roomSlug ? item.slug === fields.roomSlug : item.title === fields.roomType);
  if (!room) invalid('Please select a listed room.');
  if (['Maintenance', 'Hold'].includes(room.availability)) invalid('This room is currently unavailable.');
  const booking = { ...fields, roomType: room.title, roomSlug: room.slug, roomPrice: room.price, id: randomUUID(), status: 'Pending', payment: 'Unpaid', createdAt: new Date().toISOString() };
  await updateJson(filePaths.bookings, data => ({ bookings: [booking, ...(data?.bookings || [])] }));
  return booking;
}

export async function createMessage(body) {
  const message = { ...contactFields(body), subject: text(body.subject, 'Subject', { required: true, max: 200 }), message: text(body.message, 'Message', { required: true, max: 10000 }), id: randomUUID(), createdAt: new Date().toISOString() };
  await updateJson(filePaths.messages, data => ({ messages: [message, ...(data?.messages || [])] }));
  return message;
}
