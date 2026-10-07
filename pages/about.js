import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function About() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/siteData.json')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load about data:', err));
  }, []);

  const about = data?.about;

  return (
    <section className="section">
      <div className="about-page">
        <section className="hero room-hero">
          <div className="hero-content">
            <h1>{about?.hero?.title}</h1>
            <p dangerouslySetInnerHTML={{ __html: about?.hero?.subtitle || '' }} />
          </div>
          <div className="bg_overlay"></div>
        </section>

        <section className="about-intro container">
          <div className="left">
            {(about?.intro?.images || []).map((image, index) => (
              <img key={index} src={image} alt={`About ${index + 1}`} />
            ))}
          </div>

          <div className="right">
            <h2>{about?.intro?.title}</h2>
            <p>{about?.intro?.text}</p>

            <Link href={about?.intro?.buttonHref || '/rooms'}><button>{about?.intro?.buttonLabel}</button></Link>
          </div>
        </section>

        <section className="about-amenities">
          <div className="content">
            <h2>{about?.amenities?.title}</h2>

            <div className="grid">
              {(about?.amenities?.items || []).map((item, index) => (
                <span key={index}>
                  <i className={item.icon}></i> {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rooms-preview">
          <div>
            <h2 className="section-title">{about?.roomsPreview?.title}</h2>
          </div>

          <div className="cards">
            {(about?.roomsPreview?.cards || []).map((room, index) => (
              <div className="card" key={index}>
                <img src={room.image} alt={room.title} />
                <h3>{room.title}</h3>
                <p>{room.price}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="testimonial">
          <div className="box">
            <div>
              <h2 style={{ color: 'white' }} className="section-title">
                {about?.testimonial?.title}
              </h2>
            </div>
            <p>"{about?.testimonial?.text}"</p>
            <h4>- {about?.testimonial?.name}</h4>
          </div>
        </section>

        <section className="about-info container">
          <div className="left">
            <img src={about?.hospitality?.image} alt={about?.hospitality?.title} />
          </div>

          <div className="right">
            <h2>{about?.hospitality?.title}</h2>
            <p>{about?.hospitality?.text}</p>

            <ul>
              {(about?.hospitality?.items || []).map((item, index) => (
                <li key={index}>✔ {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="about-gallery">
          <div>
            <h2 style={{ marginBottom: '20px' }} className="section-title">
              {about?.gallery?.title}
            </h2>
          </div>

          <div className="about_gallery">
            {(about?.gallery?.images || []).map((image, index) => (
              <img key={index} src={image} alt={`Gallery ${index + 1}`} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
