export async function getStaticPaths() { return { paths: [], fallback: 'blocking' }; }
import SiteImage from '../../components/SiteImage';
import { publicPage } from '../../lib/publicPage.js';
import Link from 'next/link';
import { PageHeading, PageCTA } from '../../components/PublicPage';
import s from '../../styles/PublicPages.module.css';

export async function getStaticProps(context) {
  const { params } = context;
  const page = await publicPage(context, 'rooms');
  const data = page.props.data;
  if (!Object.hasOwn(data.roomDetails || {}, params.type)) return { notFound: true, revalidate: 60 };
  const card = data.roomsPage.availableRooms.find(item => item.slug === params.type);
  const detail = data.roomDetails[params.type];
  return { revalidate: 60, props: { siteLayout: page.props.siteLayout, siteImages: page.props.siteImages, room: { ...detail, ...(card ? { name: card.title, price: card.price, availability: card.availability || 'Available' } : {}) }, type: params.type, bookingBenefits: data.bookingBenefits || [] } };
}

export default function RoomDetail({ room, type, bookingBenefits }) {
  const booking = `/book-now?${new URLSearchParams({room:room.name, price:room.price || '', slug:String(type || '')})}`;
  return <main className={s.page}>
    <PageHeading eyebrow="Our rooms" title={room.name} text={room.heroSubtitle}/>
    <div className={s.wrap}>
      <div className={s.detailPhotos}>{(room.images || []).map((image,i) => <SiteImage key={image} src={image} alt={`${room.name}, view ${i+1}`} loading={i===0?'eager':'lazy'} fetchPriority={i===0?'high':undefined} sizes="(max-width: 760px) 100vw, 50vw"/>)}</div>
      <section className={`${s.detailLayout} ${s.section}`}>
        <div className={s.detailCopy}><p className={s.eyebrow}>YOUR SPACE TO UNWIND</p><h2>A closer look at your room.</h2><ul className={s.inlineFeatures}>{(room.icons || []).map((item,i) => <li key={i}><i className={item.icon} aria-hidden="true"/>{item.label}</li>)}</ul><p>{room.desc}</p>
          <section><h3>Room facilities</h3><ul className={s.facilityGrid}>{(room.facilities || []).map((item,i) => <li key={i}>{item}</li>)}</ul></section>
          <section><h3>Included amenities</h3><ul className={s.facilityGrid}>{(room.amenities || []).map((item,i) => <li key={i}>{item}</li>)}</ul></section>
          {!!room.reviews?.length && <section><h3>Guest experiences</h3>{room.reviews.map((review,i) => <figure className={s.review} key={i}><p>{review.rating}</p><p>“{review.text}”</p><figcaption><strong>{review.name}</strong></figcaption></figure>)}</section>}
        </div>
        <aside className={s.stayCard} aria-label="Plan a stay in this room"><p className={s.eyebrow}>STAY AT LOTUS INN</p><p className={s.price}>{room.price}</p><ul className={s.checkList}>{bookingBenefits.map((item,i) => <li key={i}>{item}</li>)}</ul><Link className={s.button} href={booking}>Request this room <span aria-hidden="true">↗</span></Link><Link href="/rooms" className={s.textLink}>Compare all rooms</Link><p className={s.smallNote}>Our team will confirm availability for your chosen dates.</p></aside>
      </section>
    </div><PageCTA title="Need a hand choosing your room?" text="Tell us about your visit and we’ll help you plan a comfortable stay." href="/contact" label="Get in touch"/>
  </main>;
}
