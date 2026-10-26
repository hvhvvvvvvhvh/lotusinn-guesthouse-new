import Link from 'next/link';
import { filePaths, readJson } from '../../lib/dataStore';

export async function getServerSideProps({ params }) {
  const data = await readJson(filePaths.rooms);
  if (!Object.hasOwn(data.roomDetails || {}, params.type)) return { notFound: true };
  const card = data.roomsPage.availableRooms.find(item => item.slug === params.type);
  const detail = data.roomDetails[params.type];
  return { props: { room: { ...detail, ...(card ? { price: card.price, availability: card.availability || 'Available' } : {}) }, type: params.type, bookingBenefits: data.bookingBenefits || [] } };
}

const RoomDetail = ({ room, type, bookingBenefits }) => {

  return (
    <div className="room-detail">
      <section className="hero room-hero">
        <div className="hero-content">
          <h1>{room.name}</h1>
          <p>{room.heroSubtitle}</p>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <div className="gallery">
        {(room.images || []).map((img, index) => (
          <img key={index} src={img} alt={room.name} />
        ))}
      </div>

      <div className="container">
        <div className="left">
          <h1>{room.name}</h1>

          <div className="icons">
            {(room.icons || []).map((item, index) => (
              <span key={index}>
                <i className={item.icon}></i> {item.label}
              </span>
            ))}
          </div>

          <p>{room.desc}</p>

          <h3>Room Facilities</h3>
          <div className="facilities">
            {(room.facilities || []).map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>

          <h3>Included Amenities</h3>
          <div className="facilities">
            {(room.amenities || []).map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>

          <h3>Reviews</h3>
          {(room.reviews || []).map((review, index) => (
            <div className="review" key={index}>
              <p>{review.rating}</p>
              <p>{review.text}</p>
              <h4>{review.name}</h4>
            </div>
          ))}
        </div>

        <div className="right">
          <h2>{room.price}</h2>

          <ul>
            {bookingBenefits.map((item, index) => (
              <li key={index}>
                <i className="fa-solid fa-check"></i> {item}
              </li>
            ))}
          </ul>

          <Link href={`/book-now?room=${encodeURIComponent(room.name)}&price=${encodeURIComponent(room.price || '')}&slug=${encodeURIComponent(String(type || ''))}`}>
            <button>Book Now</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomDetail;
