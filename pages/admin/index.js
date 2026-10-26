import { requireAdminPage } from '../../lib/adminAuth.js';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';
import { bookingAmount, localToday } from '../../lib/booking.js';

export async function getServerSideProps(context) {
  const denied = await requireAdminPage(context);
  if (denied) return denied;


  const [roomsData, bookingsData, messagesData, blogsData] = await Promise.all([
    readJson(filePaths.rooms), readJson(filePaths.bookings), readJson(filePaths.messages), readJson(filePaths.blogs),
  ]);
  const rooms = roomsData?.roomsPage?.availableRooms || [];
  const bookings = bookingsData.bookings || [];
  const messages = messagesData.messages || [];
  const blogs = blogsData.blogs || [];
  const totalRooms = rooms.length;
  const activeBookings = bookings.length;
  const totalMessages = messages.length;
  const publishedBlogs = blogs.filter((item) => item.status === 'Published').length;
  const monthlyIncome = bookings.filter(item => !['Cancelled', 'No Show'].includes(item.status)).reduce((sum, item) => sum + bookingAmount(item), 0);
  const year = localToday().slice(0, 4);
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const prefix = year + '-' + String(index + 1).padStart(2, '0');
    const items = bookings.filter(item => String(item.checkIn || '').startsWith(prefix));
    return { label: new Date(Date.UTC(Number(year), index, 1)).toLocaleString('en', { month: 'short', timeZone: 'UTC' }), count: items.length };
  });
  return { props: { monthly, year, totalRooms, activeBookings, totalMessages, monthlyIncome, publishedBlogs, bookings, messages } };
}

export default function AdminDashboard({ monthly, year, totalRooms, activeBookings, totalMessages, monthlyIncome, publishedBlogs, bookings, messages }) {
  const recentBookings = bookings.slice(0, 5);
  const recentMessages = messages.slice(0, 5);
  const maximum = Math.max(1, ...monthly.map(item => item.count));
  return (
    <AdminLayout title="Professional dashboard for Lotus Inn Guest House operations.">
      <section className="admin-cards">
        <div className="admin-card"><i className="fa-solid fa-bed"></i><div><h3>Rooms</h3><p>Total listed rooms</p><strong>{totalRooms}</strong></div></div>
        <div className="admin-card"><i className="fa-solid fa-calendar-check"></i><div><h3>Bookings</h3><p>Total booking requests</p><strong>{activeBookings}</strong></div></div>
        <div className="admin-card"><i className="fa-solid fa-envelope-open-text"></i><div><h3>Messages</h3><p>Guest contact inquiries</p><strong>{totalMessages}</strong></div></div>
        <div className="admin-card"><i className="fa-solid fa-newspaper"></i><div><h3>Published Blogs</h3><p>Live travel articles</p><strong>{publishedBlogs}</strong></div></div><div className="admin-card"><i className="fa-solid fa-wallet"></i><div><h3>Potential Revenue</h3><p>From booking requests</p><strong>PKR {monthlyIncome.toLocaleString()}</strong></div></div>
      </section>

      <section className="admin-grid">
        <div className="admin-panel">
          <h3>Booking Performance</h3>
          <p>Booking arrivals by month in {year}.</p>
          <div className="admin-chart">
            <svg viewBox="0 0 800 360" role="img" aria-label={`Monthly booking arrivals in ${year}`}>
              <line x1="30" y1="290" x2="780" y2="290" stroke="#d6dfeb" strokeWidth="2" />
              {monthly.map((item,index) => {
                const height = item.count / maximum * 210;
                const x = 38 + index * 62;
                return <g key={item.label}><title>{`${item.label}: ${item.count} bookings`}</title><rect x={x} y={290-height} width="36" height={height} rx="4" fill="#0b6b49" /><text x={x+18} y={275-height} textAnchor="middle" fill="#17362a" fontSize="14">{item.count}</text><text x={x+18} y="325" textAnchor="middle" fill="#62756b" fontSize="13">{item.label}</text></g>;
              })}
            </svg>
          </div>
        </div>
        <div className="admin-mini-stack">
          <div className="admin-stat-box">
            <h4>Guest House Status</h4>
            <span>Mirpur, AJK</span>
            <strong>Open</strong>
            <span>Front desk and booking support active</span>
          </div>
          <div className="admin-currency">
            <h3 style={{marginTop:0}}>Quick Snapshot</h3>
            <p>Manage rooms, booking flow, and guest communication from one place.</p>
            <div style={{display:'grid',gap:'12px',marginTop:'18px'}}>
              <div className="admin-room-item"><div className="admin-room-meta"><h4>Bookings Pending</h4><p>Review and confirm upcoming stays</p></div><strong>{bookings.filter(item => (item.status || 'Pending') === 'Pending').length}</strong></div>
              <div className="admin-room-item"><div className="admin-room-meta"><h4>Messages Pending</h4><p>Respond to guest questions fast</p></div><strong>{totalMessages}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-bottom">
        <div className="admin-panel">
          <div className="admin-header-row"><h3>Recent Bookings</h3><a className="admin-btn" href="/admin/bookings">View All</a></div>
          <table className="admin-table"><thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Status</th></tr></thead><tbody>
          {recentBookings.length ? recentBookings.map((item) => (
            <tr key={item.id}><td>{item.fullName}</td><td>{item.roomType}</td><td>{item.checkIn} → {item.checkOut}</td><td><span className="admin-tag pending">{item.status || 'Pending'}</span></td></tr>
          )) : <tr><td colSpan="4">No bookings yet.</td></tr>}
          </tbody></table>
        </div>
        <div className="admin-panel">
          <div className="admin-header-row"><h3>Guest Messages</h3><a className="admin-btn" href="/admin/messages">View All</a></div>
          <table className="admin-table"><thead><tr><th>Name</th><th>Subject</th><th>Status</th></tr></thead><tbody>
          {recentMessages.length ? recentMessages.map((item) => (
            <tr key={item.id}><td>{item.fullName}</td><td>{item.subject}</td><td><span className="admin-tag new">New</span></td></tr>
          )) : <tr><td colSpan="3">No messages yet.</td></tr>}
          </tbody></table>
        </div>
      </section>
    </AdminLayout>
  );
}
