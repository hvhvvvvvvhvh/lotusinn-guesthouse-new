import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const roomsData = await readJson(filePaths.rooms);
  const bookingsData = await readJson(filePaths.bookings);
  const messagesData = await readJson(filePaths.messages);
  const blogsData = await readJson(filePaths.blogs);
  const rooms = roomsData?.roomsPage?.availableRooms || [];
  const bookings = bookingsData.bookings || [];
  const messages = messagesData.messages || [];
  const blogs = blogsData.blogs || [];
  const totalRooms = rooms.length;
  const activeBookings = bookings.length;
  const totalMessages = messages.length;
  const publishedBlogs = blogs.filter((item) => item.status === 'Published').length;
  const monthlyIncome = bookings.reduce((sum, item) => sum + Number(String(item.roomPrice || '').replace(/[^\d.]/g, '') || 0), 0);
  return { props: { totalRooms, activeBookings, totalMessages, monthlyIncome, publishedBlogs, bookings, messages } };
}

export default function AdminDashboard({ totalRooms, activeBookings, totalMessages, monthlyIncome, publishedBlogs, bookings, messages }) {
  const recentBookings = bookings.slice(0, 5);
  const recentMessages = messages.slice(0, 5);
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
          <p>Monthly overview for the current Lotus Inn demo dashboard.</p>
          <div className="admin-chart">
            <svg viewBox="0 0 800 360" preserveAspectRatio="none">
              <line x1="60" y1="300" x2="760" y2="300" stroke="#d6dfeb" strokeWidth="2"/>
              <line x1="60" y1="240" x2="760" y2="240" stroke="#e8eef5" strokeWidth="1"/>
              <line x1="60" y1="180" x2="760" y2="180" stroke="#e8eef5" strokeWidth="1"/>
              <line x1="60" y1="120" x2="760" y2="120" stroke="#e8eef5" strokeWidth="1"/>
              <polyline fill="none" stroke="#2f9ad1" strokeWidth="4" points="80,260 200,220 320,140 440,170 560,230 680,210 740,160" />
              <polyline fill="none" stroke="#f1b214" strokeWidth="4" points="80,285 200,275 320,270 440,262 560,272 680,290 740,280" />
              {[80,200,320,440,560,680,740].map((x,idx)=><circle key={idx} cx={x} cy={[260,220,140,170,230,210,160][idx]} r="6" fill="#4f475e"/>)}
              {[80,200,320,440,560,680,740].map((x,idx)=><circle key={`b${idx}`} cx={x} cy={[285,275,270,262,272,290,280][idx]} r="6" fill="#4f475e"/>)}
              <text x="80" y="335" fill="#73819a" fontSize="14">Jan</text><text x="200" y="335" fill="#73819a" fontSize="14">Feb</text><text x="320" y="335" fill="#73819a" fontSize="14">Mar</text><text x="440" y="335" fill="#73819a" fontSize="14">Apr</text><text x="560" y="335" fill="#73819a" fontSize="14">May</text><text x="680" y="335" fill="#73819a" fontSize="14">Jun</text><text x="740" y="335" fill="#73819a" fontSize="14">Jul</text>
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
              <div className="admin-room-item"><div className="admin-room-meta"><h4>Bookings Pending</h4><p>Review and confirm upcoming stays</p></div><strong>{activeBookings}</strong></div>
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
            <tr key={item.id}><td>{item.fullName}</td><td>{item.roomType}</td><td>{item.checkIn} → {item.checkOut}</td><td><span className="admin-tag pending">Pending</span></td></tr>
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
