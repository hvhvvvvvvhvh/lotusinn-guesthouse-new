import { useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps() {
  const roomsData = await readJson(filePaths.rooms);
  const bookingsData = await readJson(filePaths.bookings).catch(() => ({ bookings: [] }));
  return {
    props: {
      initialRoomsData: roomsData,
      initialBookings: bookingsData.bookings || []
    }
  };
}

function normalizeStatus(status) {
  return String(status || 'Available').trim();
}

function isActiveBooking(booking) {
  return ['Pending', 'Confirmed', 'Checked In'].includes(booking.status || 'Pending');
}

export default function RoomAvailability({ initialRoomsData, initialBookings }) {
  const [roomsData, setRoomsData] = useState(initialRoomsData);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [filter, setFilter] = useState('All');

  const rooms = roomsData?.roomsPage?.availableRooms || [];
  const bookings = initialBookings || [];

  const derivedRooms = useMemo(() => {
    return rooms.map((room) => {
      const relatedBooking = bookings.find((booking) => {
        const bookingRoom = String(booking.roomType || booking.room || '').toLowerCase();
        const roomTitle = String(room.title || '').toLowerCase();
        return isActiveBooking(booking) && bookingRoom && roomTitle && bookingRoom.includes(roomTitle.split(' ')[0]);
      });

      const statusValue = relatedBooking ? 'Booked' : normalizeStatus(room.availability);

      return {
        ...room,
        availability: statusValue,
        activeBooking: relatedBooking || null
      };
    });
  }, [rooms, bookings]);

  const filteredRooms = derivedRooms.filter((room) => filter === 'All' || room.availability === filter);

  const totals = useMemo(() => ({
    total: derivedRooms.length,
    available: derivedRooms.filter((room) => room.availability === 'Available').length,
    booked: derivedRooms.filter((room) => room.availability === 'Booked').length,
    maintenance: derivedRooms.filter((room) => room.availability === 'Maintenance').length
  }), [derivedRooms]);

  const saveAll = async (nextData) => {
    const res = await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextData)
    });
    if (!res.ok) throw new Error('Save failed');
  };

  const updateAvailability = async (slug, availability) => {
    try {
      const updateRoom = (room) => (room.slug === slug ? { ...room, availability } : room);
      const nextData = {
        ...roomsData,
        roomsPage: {
          ...roomsData.roomsPage,
          availableRooms: (roomsData.roomsPage?.availableRooms || []).map(updateRoom),
          masterRooms: (roomsData.roomsPage?.masterRooms || []).map(updateRoom)
        },
        roomDetails: {
          ...roomsData.roomDetails,
          [slug]: {
            ...(roomsData.roomDetails?.[slug] || {}),
            availability
          }
        }
      };
      await saveAll(nextData);
      setRoomsData(nextData);
      setStatus({ type: 'success', message: 'Room availability updated successfully.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Availability could not be updated.' });
    }
  };

  return (
    <AdminLayout title="Monitor and manage all room availability from one place.">
      <div className="availability-shell">
        <div className="availability-cards">
          <div><span>Total Rooms</span><strong>{totals.total}</strong></div>
          <div><span>Available</span><strong>{totals.available}</strong></div>
          <div><span>Booked</span><strong>{totals.booked}</strong></div>
          <div><span>Maintenance</span><strong>{totals.maintenance}</strong></div>
        </div>

        <div className="admin-panel availability-panel">
          <div className="admin-header-row">
            <div>
              <h3>Room Availability</h3>
              <p>View all rooms, current status, linked booking details and update availability quickly.</p>
            </div>
            <select className="availability-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All</option>
              <option>Available</option>
              <option>Booked</option>
              <option>Maintenance</option>
              <option>Hold</option>
            </select>
          </div>

          {status.message ? <div className={`admin-alert ${status.type}`}>{status.message}</div> : null}

          <div className="availability-grid">
            {filteredRooms.map((room) => (
              <div className="availability-room-card" key={room.slug}>
                <img src={room.image} alt={room.title} />
                <div className="availability-room-body">
                  <div className="availability-room-head">
                    <div>
                      <h4>{room.title}</h4>
                      <p>Room No: {room.roomNumber || 'N/A'} · {room.price}</p>
                    </div>
                    <span className={`admin-availability-pill ${String(room.availability).toLowerCase()}`}>{room.availability}</span>
                  </div>

                  {room.activeBooking ? (
                    <div className="availability-booking-note">
                      <strong>Active Booking</strong>
                      <span>{room.activeBooking.fullName || room.activeBooking.name || 'Guest'} · {room.activeBooking.checkIn || room.activeBooking.checkin || 'N/A'} → {room.activeBooking.checkOut || room.activeBooking.checkout || 'N/A'}</span>
                    </div>
                  ) : (
                    <div className="availability-booking-note empty">
                      <strong>No active booking</strong>
                      <span>Room can be marked available, held or in maintenance.</span>
                    </div>
                  )}

                  <div className="availability-actions">
                    {['Available', 'Booked', 'Maintenance', 'Hold'].map((item) => (
                      <button key={item} type="button" className={room.availability === item ? 'active' : ''} onClick={() => updateAvailability(room.slug, item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
