import Link from 'next/link';
import SiteImage from './SiteImage';
import s from '../styles/PublicPages.module.css';

export function PageHeading({ eyebrow, title, text, image, imageAlt = '', children }) {
  return <header className={`${s.pageHeading} ${image ? s.splitHeading : ''}`}>
    <div className={s.headingCopy}>
      <nav className={s.breadcrumb} aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>{eyebrow}</span></nav>
      <p className={s.eyebrow}>{eyebrow}</p><h1>{title}</h1>
      {text && <p className={s.lead}>{text}</p>}{children}
    </div>
    {image && <div className={s.headingPhoto}><SiteImage src={image} alt={imageAlt} loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 50vw" /></div>}
  </header>;
}

export function PageCTA({ title = 'Make yourself at home in Mirpur.', text = 'Find your room and plan your stay with Lotus Inn.', href = '/book-now', label = 'Plan your stay' }) {
  return <section className={s.cta}><div><p className={s.eyebrow}>WE LOOK FORWARD TO WELCOMING YOU</p><h2>{title}</h2>{text && <p>{text}</p>}</div><Link href={href} className={s.lightButton}>{label}<span aria-hidden="true">↗</span></Link></section>;
}

export function SectionHeading({ eyebrow, title, text, children }) {
  return <div className={s.sectionHeading}><div>{eyebrow && <p className={s.eyebrow}>{eyebrow}</p>}<h2>{title}</h2>{text && <p>{text}</p>}</div>{children}</div>;
}

export function RoomCard({ room }) {
  const query = new URLSearchParams({ room: room.title || '', slug: room.slug || '', price: room.price || '', tag: room.tag || '' });
  return <article className={s.roomCard}>
    <Link href={`/room/${room.slug}`} className={s.cardPhoto} aria-label={`View ${room.title}`}><SiteImage src={room.image} alt={room.title} sizes="(max-width: 760px) 100vw, (max-width: 1000px) 50vw, 33vw" />{room.tag && <span className={s.photoTag}>{room.tag}</span>}</Link>
    <div className={s.cardBody}><h3><Link href={`/room/${room.slug}`}>{room.title}</Link></h3><p>{room.description || room.text}</p>
      {room.availability && <span className={s.availability}>{room.availability}</span>}
      {!!room.badges?.length && <ul className={s.inlineFeatures}>{room.badges.map((badge, i) => <li key={i}><i className={badge.icon} aria-hidden="true" />{badge.label}</li>)}</ul>}
      <div className={s.cardFoot}><strong>{room.price}</strong><div className={s.cardActions}><Link href={`/room/${room.slug}`} className={s.outlineButton}>View room</Link><Link href={`/book-now?${query}`} className={s.button}>Book now <span aria-hidden="true">↗</span></Link></div></div>
    </div>
  </article>;
}
