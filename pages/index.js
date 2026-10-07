import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/siteData.json')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load home data:', err));
  }, []);

  const home = data?.home;

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 dangerouslySetInnerHTML={{ __html: home?.hero?.title || '' }} />
          <p>{home?.hero?.subtitle}</p>

          <div className="booking-bar">
            {(home?.hero?.bookingPlaceholders || []).map((placeholder, index) => (
              <input key={index} placeholder={placeholder} />
            ))}
            <a href={home?.hero?.bookingButton?.href || '/book-now'}>
              {home?.hero?.bookingButton?.label || 'Check Availability'}
            </a>
          </div>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <section className="room_section">
        <h2 className="section-title">{home?.rooms?.title}</h2>
        <p style={{ textAlign: 'center' }} className="section-sub">
          {home?.rooms?.subtitle}
        </p>
        <div className="cards">
          {(home?.rooms?.cards || []).map((room, index) => (
            <div className="card" key={index}>
              <img src={room.image} alt={room.title} />
              <h3>{room.title}</h3>
              <p>{room.price}</p>
              <a href={room.link}>{room.linkLabel}</a>
            </div>
          ))}
        </div>
      </section>

      <section className="amenities-section">
        <h2 className="section-title">{home?.amenities?.title}</h2>
        <p className="section-sub">{home?.amenities?.subtitle}</p>

        <div className="amenities-wrapper">
          {(home?.amenities?.items || []).map((item, index) => (
            <div className="amenity-item" key={index}>
              <i className={item.icon}></i>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="gallery-section">
        <h2 className="section-title">{home?.gallery?.title}</h2>
        <p className="section-sub">{home?.gallery?.subtitle}</p>

        <div className="gallery-wrapper">
          {(home?.gallery?.images || []).map((image, index) => (
            <img key={index} src={image} alt={`Gallery ${index + 1}`} />
          ))}
        </div>
      </section>

      <section className="reviews-section">
        <h2 className="section-title">{home?.reviews?.title}</h2>
        <p className="section-sub">{home?.reviews?.subtitle}</p>

        <div className="reviews-slider">
          <div className="reviews-track">
            {(home?.reviews?.groups || []).map((group, groupIndex) => (
              <div className="reviews-group" key={groupIndex}>
                {group.map((review, reviewIndex) => (
                  <div className="review-card" key={reviewIndex}>
                    <img src={review.image} alt={review.name} />
                    <div>
                      <p>{review.text}</p>
                      <h4>{review.name}</h4>
                      <p className="dash">----</p>
                      <div className="stars">{review.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="dots">
          <span></span> <span></span> <span></span> <span></span>
        </div>
      </section>

      <section className="blog-section">
        <h2 className="section-title">{home?.blog?.title}</h2>
        <p className="section-sub">{home?.blog?.subtitle}</p>

        <div className="blog-wrapper">
          {(home?.blog?.posts || []).map((post, index) => (
            <div className="blog-card" key={index}>
              <img src={post.image} alt={post.title} />
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href={post.link}>{post.linkLabel}</a>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2 className="section-title">{home?.cta?.title}</h2>
        <a href={home?.cta?.href || '/book-now'}>{home?.cta?.label}</a>
      </section>
    </>
  );
}
