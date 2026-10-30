import { useMemo, useState } from 'react';
import Link from 'next/link';
import { publicPage } from '../lib/publicPage.js';
import { PageHeading, PageCTA, SectionHeading, RoomCard } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
export async function getStaticProps(context) { return publicPage(context, 'rooms'); }

export default function Rooms({ data, siteImages }) {
  const page = data.roomsPage;
  const [type, setType] = useState('all');
  const [price, setPrice] = useState('all');
  const rooms = useMemo(() => {
    const seen = new Set();
    return (page.availableRooms || []).filter(room => { if (seen.has(room.slug)) return false; seen.add(room.slug); return true; });
  }, [page]);
  const filtered = rooms.filter(room => {
    const cost = Number(String(room.price).replace(/[^\d]/g, ''));
    return (type === 'all' || String(room.tag || room.title).toLowerCase().includes(type.toLowerCase())) && (price === 'all' || (price === 'under' ? cost <= 5000 : price === 'mid' ? cost > 5000 && cost <= 8000 : cost > 8000));
  });
  const types = [...new Set(rooms.map(room => room.tag).filter(Boolean))];
  return <main className={s.page}>
    <PageHeading eyebrow="Our rooms" title={page.hero?.title || 'A room for every kind of stay.'} text="Find your space to unwind in Mirpur. Explore our rooms, compare nightly rates, and send your stay request directly to our team." image={siteImages?.hero || rooms[0]?.image} imageAlt="A welcoming room at Lotus Inn" />
    <div className={s.wrap}>
      <section className={s.section} aria-labelledby="room-selection-title">
        <SectionHeading eyebrow="REST, YOUR WAY" title="Find your room" text={page.masterSubtitle} />
        <div className={s.filters} aria-label="Filter rooms">
          <label>Room type<select value={type} onChange={e => setType(e.target.value)}><option value="all">All room types</option>{types.map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Nightly rate<select value={price} onChange={e => setPrice(e.target.value)}><option value="all">All prices</option><option value="under">Up to Rs 5,000</option><option value="mid">Rs 5,001–8,000</option><option value="over">Above Rs 8,000</option></select></label>
          <button type="button" className={s.outlineButton} onClick={() => { setType('all'); setPrice('all'); }}>Reset filters</button>
        </div>
        <div className={s.results}><h3 id="room-selection-title">Our accommodation</h3><p role="status">{filtered.length} {filtered.length === 1 ? 'room type' : 'room types'}</p></div>
        <div className={s.roomGrid}>{filtered.map(room => <RoomCard key={room.slug} room={room} />)}{!filtered.length && <div className={s.empty}><h3>No rooms match these filters.</h3><p>Try another room type or price range.</p><button className={s.button} onClick={() => { setType('all'); setPrice('all'); }}>Show all rooms</button></div>}</div>
      </section>
      <section className={s.featureBand}><div><p className={s.eyebrow}>THE EVERYDAY ESSENTIALS</p><h2>{page.facilitiesTitle || 'Comfort comes included.'}</h2></div><div className={s.featureGrid}>{(page.facilities || []).map((item, i) => <div key={i} className={s.feature}><i className={item.icon} aria-hidden="true" /><span>{item.label}</span></div>)}</div></section>
      <section className={s.section}><SectionHeading eyebrow="A LITTLE MORE COMFORT" title={page.amenitiesShowcase?.title || 'Thoughtful extras for your stay.'} text={page.amenitiesShowcase?.subtitle}><Link href="/amenities" className={s.textLink}>All amenities <span aria-hidden="true">↗</span></Link></SectionHeading><div className={s.threeGrid}>{(page.amenitiesShowcase?.items || []).slice(0,3).map((item,i) => <article key={i} className={s.infoCard}><i className={item.icon} aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></section>
    </div><PageCTA title={page.cta?.title} href={page.cta?.href} label={page.cta?.label || 'Plan your stay'} />
  </main>;
}
