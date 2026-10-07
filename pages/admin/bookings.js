import { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const data = await readJson(filePaths.bookings);
  return { props: { items: data.bookings || [] } };
}

const demoBookings = [
  {
    id: 'demo-1',
    fullName: 'Ali Khan',
    phone: '03001234567',
    email: 'ali@example.com',
    roomType: 'Deluxe Room',
    checkIn: '2026-04-25',
    checkOut: '2026-04-27',
    guests: 2,
    amount: 14000,
    status: 'Pending',
    payment: 'Unpaid',
    specialRequests: 'Late check-in requested.',
  },
  {
    id: 'demo-2',
    fullName: 'Sadia Khan',
    phone: '03121234567',
    email: 'sadia@example.com',
    roomType: 'Family Room',
    checkIn: '2026-04-28',
    checkOut: '2026-04-30',
    guests: 4,
    amount: 18000,
    status: 'Confirmed',
    payment: 'Partial',
    specialRequests: 'Breakfast included.',
  },
];

function getNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}

function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`;
}

function normalizeBooking(item, index) {
  const checkIn = item.checkIn || item.checkin || '';
  const checkOut = item.checkOut || item.checkout || '';

  return {
    id: item.id || `booking-${index + 1}`,
    fullName: item.fullName || item.name || 'Guest',
    phone: item.phone || item.mobile || 'N/A',
    email: item.email || '',
    roomType: item.roomType || item.room || 'Standard Room',
    checkIn,
    checkOut,
    guests: Number(item.guests || item.guestCount || 1),
    nights: getNights(checkIn, checkOut),
    amount: Number(item.amount || item.totalAmount || 0),
    status: item.status || 'Pending',
    payment: item.payment || 'Unpaid',
    specialRequests: item.specialRequests || item.notes || '',
  };
}

export default function AdminBookings({ items }) {
  const initialItems = items && items.length ? items : demoBookings;

  const [bookings, setBookings] = useState(
    initialItems.map((item, index) => normalizeBooking(item, index))
  );

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const updateStatus = (id, status) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, status } : booking
      )
    );
  };

  const updatePayment = (id, payment) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === id ? { ...booking, payment } : booking
      )
    );
  };

  const deleteBooking = (id) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== id));
  };

  const openView = (booking) => {
    setSelectedBooking(booking);
    setEditForm({ ...booking });
    setEditMode(false);
  };

  const openEdit = (booking) => {
    setSelectedBooking(booking);
    setEditForm({ ...booking });
    setEditMode(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveEdit = () => {
    const updated = {
      ...editForm,
      guests: Number(editForm.guests || 1),
      amount: Number(editForm.amount || 0),
      nights: getNights(editForm.checkIn, editForm.checkOut),
    };

    setBookings((prev) =>
      prev.map((booking) => (booking.id === updated.id ? updated : booking))
    );

    setSelectedBooking(updated);
    setEditForm(updated);
    setEditMode(false);
  };

  const filteredBookings = useMemo(() => {
    const search = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesSearch =
        !search ||
        booking.fullName.toLowerCase().includes(search) ||
        booking.phone.toLowerCase().includes(search) ||
        booking.roomType.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === 'All' || booking.status === statusFilter;

      const matchesPayment =
        paymentFilter === 'All' || booking.payment === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [bookings, query, statusFilter, paymentFilter]);

  const totals = useMemo(() => {
    return {
      todayArrivals: 2,
      todayDepartures: 1,
      activeStays:
        bookings.filter((b) => ['Confirmed', 'Checked In'].includes(b.status))
          .length || 1,
      revenue: bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0),
    };
  }, [bookings]);

  return (
    <AdminLayout title="Manage guest bookings, reservations, payments and stay status.">
      <div className="bookings-page-shell modern">
        <div className="booking-stats-grid compact">
          <div className="booking-stat-card flat">
            <span>Today Arrivals</span>
            <strong>{totals.todayArrivals}</strong>
          </div>

          <div className="booking-stat-card flat">
            <span>Today Departures</span>
            <strong>{totals.todayDepartures}</strong>
          </div>

          <div className="booking-stat-card flat">
            <span>Active Stays</span>
            <strong>{totals.activeStays}</strong>
          </div>

          <div className="booking-stat-card flat">
            <span>Revenue</span>
            <strong>{formatCurrency(totals.revenue)}</strong>
          </div>
        </div>

        <div className="booking-filter-card">
          <div>
            <h3>Booking Requests</h3>
            <p>Search, filter, confirm and manage all guest reservations.</p>
          </div>

          <div className="booking-filter-controls">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guest, phone or room"
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Checked In</option>
              <option>Checked Out</option>
              <option>Cancelled</option>
              <option>No Show</option>
            </select>

            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
              <option>All</option>
              <option>Unpaid</option>
              <option>Partial</option>
              <option>Paid</option>
            </select>
          </div>
        </div>

        <div className="booking-table-card">
          <table className="booking-table-responsive">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Guests</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td data-label="Guest">
                    <strong>{booking.fullName}</strong>
                    <small>{booking.phone}</small>
                  </td>

                  <td data-label="Room">
                    <strong>{booking.roomType}</strong>
                    <small>{booking.nights} night(s)</small>
                  </td>

                  <td data-label="Dates">
                    <strong>{booking.checkIn}</strong>
                    <small>to {booking.checkOut}</small>
                  </td>

                  <td data-label="Guests">{booking.guests}</td>

                  <td data-label="Amount">
                    <strong>{formatCurrency(booking.amount)}</strong>
                  </td>

                  <td data-label="Status">
                    <span className={`status-pill ${booking.status.toLowerCase().replaceAll(' ', '-')}`}>
                      {booking.status}
                    </span>
                    <select
                      className="booking-inline-select"
                      value={booking.status}
                      onChange={(e) => updateStatus(booking.id, e.target.value)}
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Checked In</option>
                      <option>Checked Out</option>
                      <option>Cancelled</option>
                      <option>No Show</option>
                    </select>
                  </td>

                  <td data-label="Payment">
                    <select
                      className="booking-inline-select"
                      value={booking.payment}
                      onChange={(e) => updatePayment(booking.id, e.target.value)}
                    >
                      <option>Unpaid</option>
                      <option>Partial</option>
                      <option>Paid</option>
                    </select>
                  </td>

                  <td data-label="Actions">
                    <div className="booking-actions">
                      <button className="booking-btn view" onClick={() => openView(booking)}>
                        View
                      </button>
                      <button className="booking-btn edit" onClick={() => openEdit(booking)}>
                        Edit
                      </button>
                      <button className="booking-btn delete" onClick={() => deleteBooking(booking.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredBookings.length && (
                <tr>
                  <td colSpan="8">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedBooking && editForm ? (
          <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
            <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
              <div className="booking-modal-head">
                <div>
                  <h3>{editMode ? 'Edit Booking' : selectedBooking.fullName}</h3>
                  <p>{selectedBooking.roomType} reservation details</p>
                </div>

                <button type="button" onClick={() => setSelectedBooking(null)}>×</button>
              </div>

              {!editMode ? (
                <>
                  <div className="booking-modal-grid">
                    <div><span>Phone</span><strong>{selectedBooking.phone}</strong></div>
                    <div><span>Email</span><strong>{selectedBooking.email || 'N/A'}</strong></div>
                    <div><span>Check-in</span><strong>{selectedBooking.checkIn}</strong></div>
                    <div><span>Check-out</span><strong>{selectedBooking.checkOut}</strong></div>
                    <div><span>Guests</span><strong>{selectedBooking.guests}</strong></div>
                    <div><span>Total Amount</span><strong>{formatCurrency(selectedBooking.amount)}</strong></div>
                    <div><span>Status</span><strong>{selectedBooking.status}</strong></div>
                    <div><span>Payment</span><strong>{selectedBooking.payment}</strong></div>
                  </div>

                  <div className="booking-modal-note">
                    <span>Special Requests</span>
                    <p>{selectedBooking.specialRequests || 'None'}</p>
                  </div>

                  <div className="booking-modal-actions">
                    <button type="button" className="booking-save-btn" onClick={() => setEditMode(true)}>
                      Edit Booking
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="booking-edit-grid">
                    <label>Guest Name<input value={editForm.fullName} onChange={(e) => handleEditChange('fullName', e.target.value)} /></label>
                    <label>Phone<input value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} /></label>
                    <label>Email<input value={editForm.email} onChange={(e) => handleEditChange('email', e.target.value)} /></label>
                    <label>Room Type<input value={editForm.roomType} onChange={(e) => handleEditChange('roomType', e.target.value)} /></label>
                    <label>Check-in<input type="date" value={editForm.checkIn} onChange={(e) => handleEditChange('checkIn', e.target.value)} /></label>
                    <label>Check-out<input type="date" value={editForm.checkOut} onChange={(e) => handleEditChange('checkOut', e.target.value)} /></label>
                    <label>Guests<input type="number" value={editForm.guests} onChange={(e) => handleEditChange('guests', e.target.value)} /></label>
                    <label>Amount<input type="number" value={editForm.amount} onChange={(e) => handleEditChange('amount', e.target.value)} /></label>

                    <label>
                      Status
                      <select value={editForm.status} onChange={(e) => handleEditChange('status', e.target.value)}>
                        <option>Pending</option>
                        <option>Confirmed</option>
                        <option>Checked In</option>
                        <option>Checked Out</option>
                        <option>Cancelled</option>
                        <option>No Show</option>
                      </select>
                    </label>

                    <label>
                      Payment
                      <select value={editForm.payment} onChange={(e) => handleEditChange('payment', e.target.value)}>
                        <option>Unpaid</option>
                        <option>Partial</option>
                        <option>Paid</option>
                      </select>
                    </label>
                  </div>

                  <label className="booking-edit-note">
                    Special Requests
                    <textarea value={editForm.specialRequests} onChange={(e) => handleEditChange('specialRequests', e.target.value)} />
                  </label>

                  <div className="booking-modal-actions">
                    <button type="button" className="booking-save-btn" onClick={saveEdit}>
                      Save Changes
                    </button>
                    <button type="button" className="booking-cancel-btn" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
}