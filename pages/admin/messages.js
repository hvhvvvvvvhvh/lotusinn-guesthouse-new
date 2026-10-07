import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const data = await readJson(filePaths.messages);
  return { props: { items: data.messages || [] } };
}

export default function AdminMessages({ items }) {
  return (
    <AdminLayout title="Guest messages captured from the public contact page.">
      <div className="admin-panel">
        <div className="admin-header-row"><h3>Messages</h3><span className="admin-btn admin-btn-outline">Total: {items.length}</span></div>
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Subject</th><th>Email</th><th>Phone</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.id}><td>{item.fullName}</td><td>{item.subject}</td><td>{item.email}</td><td>{item.phone}</td><td><span className="admin-tag new">New</span></td></tr>
            )) : <tr><td colSpan="5">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
