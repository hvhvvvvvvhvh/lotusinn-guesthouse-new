import AdminLayout from '../../components/AdminLayout';



export default function AdminMessages({ items }) {
  return (
    <AdminLayout title="Guest messages captured from the public contact page.">
      <div className="admin-panel">
        <div className="admin-header-row"><h3>Messages</h3><span className="admin-btn admin-btn-outline">Total: {items.length}</span></div>
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Subject</th><th>Message</th><th>Email</th><th>Phone</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.id}><td>{item.fullName}</td><td>{item.subject}</td><td style={{ whiteSpace: 'pre-wrap' }}>{item.message}</td><td>{item.email}</td><td>{item.phone}</td><td><span className="admin-tag new">New</span></td></tr>
            )) : <tr><td colSpan="6">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
