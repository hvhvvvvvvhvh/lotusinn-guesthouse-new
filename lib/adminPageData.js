import { filePaths, readJson } from './dataStore.js';
import { listRecords, allRecords, getRecord, adminTotals } from './recordStore.js';
import { adminBlogSummary, adminAuthorSummary } from './adminContent.js';
import { adminImageSlots } from './adminImageSlots.js';
import { imageSlots, withImageDefaults } from './imageSlots.js';
import { bookingAmount, localToday } from './booking.js';

const blogFields = ['id', 'slug', 'title', 'authorId', 'category', 'publishDate', 'status', 'featuredImage', 'updatedAt'];
const authorFields = ['id', 'slug', 'name', 'role', 'image', 'updatedAt'];
const authorOptions = () => allRecords('authors', { fields: ['id', 'name'] });

export async function getAdminPageData(path, query = {}) {
  const today = localToday();
  const page = Math.max(1, Math.min(100000, Number.parseInt(query.page, 10) || 1));
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 120) : '';
  const limit = 50;
  const paged = async (dataset, fields) => {
    const result = await listRecords(dataset, { limit, offset: (page - 1) * limit, search, fields });
    return { ...result, pagination: { page, pageSize: limit, total: result.total, search } };
  };
  if (path === '/admin') {
    const [totals, bookings, messages] = await Promise.all([
      adminTotals('dashboard', today), listRecords('bookings', { limit: 5 }), listRecords('messages', { limit: 5 }),
    ]);
    if (totals) return { ...totals, bookings: bookings.items, messages: messages.items };
    const [rooms, allBookings, allMessages, blogs] = await Promise.all([readJson(filePaths.rooms), allRecords('bookings'), allRecords('messages'), allRecords('blogs', { fields: ['status'] })]);
    const year = today.slice(0, 4);
    return { year, totalRooms: rooms.roomsPage.availableRooms.length, activeBookings: allBookings.length, totalMessages: allMessages.length,
      publishedBlogs: blogs.filter(item => item.status === 'Published').length, pendingBookings: allBookings.filter(item => (item.status || 'Pending') === 'Pending').length,
      monthlyIncome: allBookings.filter(item => !['Cancelled', 'No Show'].includes(item.status)).reduce((sum, item) => sum + bookingAmount(item), 0),
      monthly: Array.from({ length: 12 }, (_, month) => ({ label: new Date(Date.UTC(Number(year), month, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' }), count: allBookings.filter(item => String(item.checkIn || '').startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length })),
      bookings: bookings.items, messages: messages.items };
  }
  if (path === '/admin/rooms' || path === '/admin/amenities') return { initialData: await readJson(filePaths.rooms) };
  if (path === '/admin/availability') {
    const [initialRoomsData, bookings] = await Promise.all([readJson(filePaths.rooms), allRecords('bookings', { activeOn: today, fields: ['id', 'fullName', 'roomSlug', 'roomType', 'checkIn', 'checkOut', 'status'] })]);
    return { initialRoomsData, initialBookings: bookings };
  }
  if (path === '/admin/images') {
    const [site, rooms] = await Promise.all([readJson(filePaths.site), readJson(filePaths.rooms)]);
    return { initialSlots: adminImageSlots(imageSlots(withImageDefaults(site), rooms)) };
  }
  if (['/admin/expenses', '/admin/bookings', '/admin/messages'].includes(path)) {
    const dataset = path.split('/').pop();
    const [result, totals] = await Promise.all([paged(dataset), dataset === 'expenses' ? adminTotals('expenses', today) : null]);
    return { items: result.items, pagination: result.pagination, ...(totals ? { expenseTotals: totals } : {}) };
  }
  if (path === '/admin/blogs') {
    const [result, authors] = await Promise.all([paged('blogs', blogFields), authorOptions()]);
    return { initialBlogs: result.items.map(adminBlogSummary), authors, pagination: result.pagination };
  }
  if (path === '/admin/authors') {
    const [result, articleCounts] = await Promise.all([paged('authors', authorFields), adminTotals('authors', today)]);
    return { authors: result.items.map(adminAuthorSummary), articleCounts, pagination: result.pagination };
  }
  if (path === '/admin/blogs/new') return { authors: await authorOptions() };
  if (path === '/admin/blogs/edit') {
    const [initialBlog, authors] = await Promise.all([getRecord('blogs', query.id), authorOptions()]);
    if (!initialBlog) throw Object.assign(new Error('Blog not found.'), { status: 404 });
    return { initialBlog, authors };
  }
  if (path === '/admin/authors/new' || path === '/admin/authors/edit') {
    const initialAuthor = query.id ? await getRecord('authors', query.id) : null;
    if (query.id && !initialAuthor) throw Object.assign(new Error('Author not found.'), { status: 404 });
    return { initialAuthor };
  }
  throw Object.assign(new Error('Admin page not found.'), { status: 404 });
}
