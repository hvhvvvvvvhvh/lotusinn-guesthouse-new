import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

function bookingHref(room) {
  const params = new URLSearchParams({
    room: room.title || room.tag || 'Room',
    price: room.price || '',
    slug: room.slug || '',
    tag: room.tag || ''
  });
  return `/book-now?${params.toString()}`;
}

export default function Rooms() {
  const [data, setData] = useState(null);
  const [selectedType, setSelectedType] = useState('Room Type');
  const [selectedPrice, setSelectedPrice] = useState('Price Range');
  const [searchClicked, setSearchClicked] = useState(false);

  useEffect(() => {
    fetch('/data/roomsData.json')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load rooms data:', err));
  }, []);

  const roomsPage = data?.roomsPage;

  const filteredAvailableRooms = useMemo(() => {
    const rooms = roomsPage?.availableRooms || [];

    return rooms.filter((room) => {
      const typeMatch =
        selectedType === 'Room Type' ||
        room.tag.toLowerCase().includes(selectedType.toLowerCase()) ||
        room.title.toLowerCase().includes(selectedType.toLowerCase());

      if (!typeMatch) return false;

      if (selectedPrice === 'Price Range') return true;

      const numericPrice = Number(room.price.replace(/[^\d]/g, ''));

      if (selectedPrice === 'Rs 3000 - 5000') {
        return numericPrice >= 3000 && numericPrice <= 5000;
      }

      if (selectedPrice === 'Rs 5000 - 8000') {
        return numericPrice >= 5000 && numericPrice <= 8000;
      }

      return true;
    });
  }, [roomsPage, selectedType, selectedPrice, searchClicked]);

  const renderRoomCard = (room, showIcons = 'badges') => (
    <div className="room-card" key={room.slug}>
      <div className="image-box">
        <img src={room.image} alt={room.title} />
        <span className="tag">{room.tag}</span>
        {room.availability ? (
          <span className={`availability-tag ${String(room.availability).toLowerCase()}`}>
            {room.availability}
          </span>
        ) : null}
        <div className="overlay">
          <Link href={`/room/${room.slug}`}>
            <button>View Details</button>
          </Link>
        </div>
      </div>

      <div className="content">
        <h3>{room.title}</h3>
        <p>{room.description || room.text}</p>

        <div className="icons">
          {showIcons === 'badges'
            ? (room.badges || []).map((badge, index) => (
                <span key={index}>
                  <i className={badge.icon}></i> {badge.label}
                </span>
              ))
            : (room.iconOnly || []).map((icon, index) => <i key={index} className={icon}></i>)}
        </div>

        <div className="bottom room-card-actions">
          <h4>{room.price}</h4>
          <div className="room-action-buttons">
            <Link href={`/room/${room.slug}`}>
              <button type="button">View Details</button>
            </Link>
            <Link href={bookingHref(room)}>
              <button type="button" className="book-room-btn">Book Now</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section>
      <div className="rooms-page">
        <section className="hero room-hero">
          <div className="hero-content">
            <h1>{roomsPage?.hero?.title}</h1>
            <p>{roomsPage?.hero?.subtitle}</p>
          </div>
          <div className="bg_overlay"></div>
        </section>

        <section className="filter-bar">
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            {(roomsPage?.filters?.types || []).map((item, index) => (
              <option key={index}>{item}</option>
            ))}
          </select>

          <select value={selectedPrice} onChange={(e) => setSelectedPrice(e.target.value)}>
            {(roomsPage?.filters?.prices || []).map((item, index) => (
              <option key={index}>{item}</option>
            ))}
          </select>

          <button onClick={() => setSearchClicked((prev) => !prev)}>Search</button>
        </section>

        <section className="room-section">
          <h2 className="section-title">{roomsPage?.masterTitle}</h2>
          <p className="section-sub">{roomsPage?.masterSubtitle}</p>
          <div className="room-grid">
            {(roomsPage?.masterRooms || []).map((room) => renderRoomCard(room, 'badges'))}
          </div>
        </section>

        <section className="room-section">
          <h2 style={{ marginBottom: '30px' }} className="section-title">
            {roomsPage?.availableTitle}
          </h2>
          <div className="room-grid">
            {filteredAvailableRooms.map((room) => renderRoomCard(room, 'icons'))}
          </div>
        </section>

        <section className="features">
          <h2 style={{ marginBottom: '20px' }} className="section-title">
            {roomsPage?.amenitiesTitle}
          </h2>
          <div className="features-grid">
            {(roomsPage?.amenities || []).map((item, index) => <div key={index}>{item}</div>)}
          </div>
        </section>

        <section className="features">
          <h2 style={{ marginBottom: '20px' }} className="section-title">
            {roomsPage?.facilitiesTitle}
          </h2>
          <div className="features-grid">
            {(roomsPage?.facilities || []).map((item, index) => (
              <div key={index}><i className={item.icon}></i> {item.label}</div>
            ))}
          </div>
        </section>

        <section className="amenities-page-section amenities-showcase-section">
          <div className="amenities-page-head">
            <h2 className="section-title">{roomsPage?.amenitiesShowcase?.title}</h2>
            <p className="section-sub">{roomsPage?.amenitiesShowcase?.subtitle}</p>
          </div>
          <div className="amenities-cards-grid">
            {(roomsPage?.amenitiesShowcase?.items || []).map((item, index) => (
              <div className="amenity-info-card" key={index}>
                <h3><i className={item.icon}></i> {item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="meal-plan-row">
            {(roomsPage?.amenitiesShowcase?.mealPlans || []).map((item, index) => (
              <div className="meal-plan-chip" key={index}>
                <strong>{item.title}</strong>
                <span>{item.price}</span>
              </div>
            ))}
          </div>
          <div className="cta-section" style={{ paddingTop: '20px', paddingBottom: '50px' }}>
            <Link href={roomsPage?.amenitiesShowcase?.buttonHref || '/amenities'}>{roomsPage?.amenitiesShowcase?.buttonLabel || 'View Full Amenities'}</Link>
          </div>
        </section>

        <section className="why-rooms">
          <h2 style={{ marginBottom: '20px' }} className="section-title">{roomsPage?.whyChooseTitle}</h2>
          <div className="why-grid">
            {(roomsPage?.whyChoose || []).map((item, index) => (
              <div key={index}><h3>{item.title}</h3><p>{item.text}</p></div>
            ))}
          </div>
        </section>

        <section className="why">
          <h2 style={{ marginBottom: '30px' }} className="section-title">{roomsPage?.whyStayTitle}</h2>
          <div className="why-grid">
            {(roomsPage?.whyStay || []).map((item, index) => (
              <div key={index}><i className={item.icon}></i><h3>{item.title}</h3><p>{item.text}</p></div>
            ))}
          </div>
        </section>

        <section className="cta-section">
          <h2 className="section-title">{roomsPage?.cta?.title}</h2>
          <Link href={roomsPage?.cta?.href || '/book-now'}>{roomsPage?.cta?.label}</Link>
        </section>
      </div>
    </section>
  );
}
