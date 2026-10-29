import SiteImage from '../components/SiteImage';
import { publicPage } from '../lib/publicPage.js';
export async function getServerSideProps(context) { return publicPage(context, 'site'); }
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function Gallery({ data: initialData }) {
  const data = initialData;
  const [filter, setFilter] = useState('all');
  const [popup, setPopup] = useState(null);
  useEffect(() => {
    if (!popup) return;
    const close = event => { if (event.key === 'Escape') setPopup(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [popup]);


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
          <div className="gallery-item" key={index} role="button" tabIndex={0} aria-label={`Open gallery image ${index + 1}`} onClick={() => setPopup(img.src)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setPopup(img.src); } }}>
            <SiteImage src={img.src} alt="Gallery" />
            <div className="hover">
              <i className="fa-solid fa-magnifying-glass"></i>
            </div>
          </div>
        ))}
      </div>

      {popup && (
        <div className="popup" onClick={() => setPopup(null)}>
          <SiteImage src={popup} alt="Popup" />
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
