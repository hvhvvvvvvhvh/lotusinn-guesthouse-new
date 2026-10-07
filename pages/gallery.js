import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function Gallery() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('all');
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetch('/data/siteData.json')
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error('Failed to load gallery data:', err));
  }, []);

  const galleryPage = data?.galleryPage;

  const filteredImages = useMemo(() => {
    const images = galleryPage?.images || [];
    return filter === 'all' ? images : images.filter((img) => img.category === filter);
  }, [galleryPage, filter]);

  return (
    <section className="gallery-page">
      <section className="hero room-hero">
        <div className="hero-content">
          <h1>{galleryPage?.hero?.title}</h1>
          <p>{galleryPage?.hero?.subtitle}</p>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <div className="filters">
        {(galleryPage?.filters || []).map((item) => (
          <button key={item.value} onClick={() => setFilter(item.value)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {filteredImages.map((img, index) => (
          <div className="gallery-item" key={index}>
            <img src={img.src} alt="Gallery" onClick={() => setPopup(img.src)} />
            <div className="hover">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
          </div>
        ))}
      </div>

      {popup && (
        <div className="popup" onClick={() => setPopup(null)}>
          <img src={popup} alt="Popup" />
        </div>
      )}

      <div className="gallery-stats">
        {(galleryPage?.stats || []).map((item, index) => (
          <div key={index}>
            <h2>{item.value}</h2>
            <p>{item.label}</p>
          </div>
        ))}
      </div>

      <section className="cta-section">
        <h2 className="section-title">{galleryPage?.cta?.title}</h2>
        <Link href={galleryPage?.cta?.href || '/book-now'}>{galleryPage?.cta?.label}</Link>
      </section>
    </section>
  );
}
