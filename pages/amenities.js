import { useEffect, useState } from 'react';
import Link from 'next/link';

function AmenitiesSection({ title, text, items = [] }) {
  return (
    <section className="amenities-page-section">
      <div className="amenities-page-head">
        <h2 className="section-title">{title}</h2>
        <p className="section-sub">{text}</p>
      </div>
      <div className="amenities-cards-grid">
        {items.map((item, index) => (
          <div className="amenity-info-card" key={index}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            {item.price ? <span>{item.price}</span> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AmenitiesPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/data/roomsData.json')
      .then((res) => res.json())
      .then((json) => setData(json.amenitiesPage))
      .catch((err) => console.error('Failed to load amenities data:', err));
  }, []);

  return (
    <>
      <section className="hero room-hero">
        <div className="hero-content">
          <h1>{data?.hero?.title}</h1>
          <p>{data?.hero?.subtitle}</p>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <section className="amenities-page-wrap">
        <div className="amenities-page-intro">
          <span className="booking-mini-title">{data?.intro?.label}</span>
          <h2>{data?.intro?.title}</h2>
          <p>{data?.intro?.text}</p>
        </div>

        <AmenitiesSection title={data?.essentialTitle} text={data?.essentialText} items={data?.essential} />
        <AmenitiesSection title={data?.premiumTitle} text={data?.premiumText} items={data?.premium} />
        <AmenitiesSection title={data?.mealPlansTitle} text={data?.mealPlansText} items={data?.mealPlans} />
        <AmenitiesSection title={data?.servicesTitle} text={data?.servicesText} items={data?.services} />

        <section className="cta-section">
          <h2 className="section-title">{data?.cta?.title}</h2>
          <Link href={data?.cta?.href || '/book-now'}>{data?.cta?.label || 'Book Now'}</Link>
        </section>
      </section>
    </>
  );
}
