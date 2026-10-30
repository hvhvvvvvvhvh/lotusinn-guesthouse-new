import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import SiteImage from './SiteImage';
import styles from '../styles/Home.module.css';

function Arrow({ diagonal = false }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function SectionHead({ eyebrow, title, subtitle, href, linkLabel, headingId }) {
  return <div className={styles.sectionHead}><div><p className={styles.eyebrow}>{eyebrow}</p><h2 id={headingId}>{title}</h2>{subtitle && <p className={styles.sectionSubtitle}>{subtitle}</p>}</div>{href && <Link className={styles.textLink} href={href}>{linkLabel}<Arrow /></Link>}</div>;
}

export default function Home({ data, siteLayout, siteImages }) {
  const home = data?.home || {};
  const router = useRouter();
  const [checkIn, setCheckIn] = useState('');
  const contact = siteLayout?.footer?.contact || {};
  const whatsapp = siteLayout?.footer?.socials?.find(item => /wa\.me\//.test(item.href))?.href;
  const reviews = (home.reviews?.groups || []).flat().slice(0, 2);
  const introImage = home.intro?.images?.[0] || home.gallery?.images?.[0];
  const findStay = event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    router.push({ pathname: '/book-now', query: { checkIn: String(fields.get('checkIn') || ''), checkOut: String(fields.get('checkOut') || ''), guests: String(fields.get('guests') || '2') } });
  };

  return <main className={styles.homepage} id="main-content">
    <div className={styles.heroFrame}>
      <section className={styles.hero} aria-labelledby="home-title">
        <SiteImage className={styles.heroImage} src={siteImages?.hero || '/images/DSC_0271.JPG'} alt="A room at Lotus Inn Guest House in Mirpur" loading="eager" fetchPriority="high" sizes="(max-width: 760px) 100vw, 1400px" />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}><span /> YOUR STAY IN MIRPUR, AJK</p>
          <h1 id="home-title" dangerouslySetInnerHTML={{ __html: home.hero?.title || 'Welcome to Lotus Inn Guest House' }} />
          <p className={styles.heroSubtitle}>{home.hero?.subtitle}</p>
          <div className={styles.heroActions}>
            <Link className={styles.lightButton} href="/rooms">Explore our rooms<Arrow diagonal /></Link>
            <Link className={styles.heroContact} href="/contact">Get in touch<Arrow /></Link>
          </div>
        </div>
        <div className={styles.heroNote}><span>LOTUS INN GUEST HOUSE</span><span>A place to settle in.</span></div>
      </section>

      <form className={styles.booking} aria-label="Find your stay" action="/book-now" method="get" onSubmit={findStay}>
        <label htmlFor="home-check-in"><span>CHECK IN</span><input id="home-check-in" name="checkIn" aria-label="Check-in date" type="date" onInput={event => setCheckIn(event.currentTarget.value)} /></label>
        <label htmlFor="home-check-out"><span>CHECK OUT</span><input id="home-check-out" name="checkOut" aria-label="Check-out date" type="date" min={checkIn || undefined} /></label>
        <label htmlFor="home-guests"><span>GUESTS</span><div className={styles.guestInput}><input id="home-guests" name="guests" aria-label="Number of guests" type="number" min="1" max="50" defaultValue="2" /><span>guests</span></div></label>
        <button className={styles.primaryButton} type="submit">{home.hero?.bookingButton?.label || 'Check Availability'}<Arrow diagonal /></button>
      </form>
    </div>

    <section className={styles.intro}>
      <div className={styles.introPhoto}>
        {introImage && <SiteImage src={introImage} alt="Inside Lotus Inn Guest House" sizes="(max-width: 760px) 100vw, 520px" />}
        <div className={styles.photoLabel}><span>Make yourself</span><strong>at home.</strong></div>
      </div>
      <div className={styles.introCopy}>
        <p className={styles.eyebrow}>A WARM WELCOME</p>
        <h2>A little pause.<br /><em>A better stay.</em></h2>
        <p>{home.intro?.text || 'Discover a comfortable place to stay in Mirpur, with room options for your next visit.'}</p>
        <p className={styles.locationLine}><i className="fa-solid fa-location-dot" aria-hidden="true" />{contact.address || 'Kotli Road, New Mirpur City, AJK'}</p>
        <Link className={styles.textLink} href="/about">Get to know Lotus Inn<Arrow /></Link>
      </div>
    </section>

    <section className={styles.roomsSection} aria-labelledby="rooms-title">
      <SectionHead eyebrow="REST, YOUR WAY" title={home.rooms?.title || 'Our Rooms'} subtitle={home.rooms?.subtitle} href="/rooms" linkLabel="Explore all rooms" headingId="rooms-title" />
      <div className={styles.roomGrid}>
        {(home.rooms?.cards || []).map((room, index) => <article key={room.link}>
          <Link className={styles.roomCard} href={room.link} aria-label={'View ' + room.title + ' details'}>
            <div className={styles.roomPhoto}><SiteImage src={room.image} alt={room.title} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 400px" /><span className={styles.roomNumber}>{String(index + 1).padStart(2, '0')}</span><span className={styles.roomArrow}><Arrow diagonal /></span></div>
            <div className={styles.roomCopy}><h3>{room.title}</h3><p className={styles.roomPrice}>{room.price}</p>{room.description && <p className={styles.roomDescription}>{room.description}</p>}<span className={styles.roomDetails}>{room.linkLabel || 'View details'}<Arrow /></span></div>
          </Link>
        </article>)}
      </div>
    </section>

    <section className={styles.amenities}>
      <div className={styles.amenitiesHeading}><p className={styles.eyebrow}>THOUGHTFUL LITTLE EXTRAS</p><h2>{home.amenities?.title || 'Amenities & Services'}</h2><Link className={styles.textLink} href="/amenities">Discover the details<Arrow /></Link></div>
      <div className={styles.amenityGrid}>{(home.amenities?.items || []).map(item => <div className={styles.amenity} key={item.label}><i className={item.icon} aria-hidden="true" /><span>{item.label}</span></div>)}</div>
    </section>

    <section className={styles.gallerySection}>
      <SectionHead eyebrow="TAKE A LOOK AROUND" title={home.gallery?.title || 'A glimpse of Lotus Inn'} subtitle={home.gallery?.subtitle} href="/gallery" linkLabel="View the full gallery" />
      <div className={styles.galleryGrid}>{(home.gallery?.images || []).slice(0, 4).map((image, index) => <Link href="/gallery" className={styles.galleryPhoto} key={image + index} aria-label={'Explore the Lotus Inn gallery, photo ' + (index + 1)}><SiteImage src={image} alt={'Lotus Inn Guest House gallery photograph ' + (index + 1)} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 600px" /><span><Arrow diagonal /></span></Link>)}</div>
    </section>

    {!!reviews.length && <section className={styles.reviews}>
      <SectionHead eyebrow="IN OUR GUESTS’ WORDS" title={home.reviews?.title || 'Guest Reviews'} subtitle={home.reviews?.subtitle} />
      <div className={styles.reviewGrid}>{reviews.map((review, index) => <figure className={styles.reviewCard} key={review.name + index}>
        <div className={styles.reviewTop}><span className={styles.quoteMark} aria-hidden="true">“</span><span className={styles.stars} aria-label={String(review.rating || '').replaceAll('⭐', 'star ')}>{review.rating}</span></div>
        <blockquote>{review.text}</blockquote><figcaption>{review.image && <SiteImage src={review.image} alt="" width="48" height="48" sizes="48px" />}<div><strong>{review.name}</strong><span>Guest at Lotus Inn</span></div></figcaption>
      </figure>)}</div>
    </section>}

    {!!home.blog?.posts?.length && <section className={styles.journal}>
      <SectionHead eyebrow="THE LOTUS INN JOURNAL" title={home.blog?.title || 'Stories for your stay'} subtitle={home.blog?.subtitle} href="/blog" linkLabel="All travel guides" />
      <div className={styles.journalGrid}>{home.blog.posts.map(post => <article className={styles.journalCard} key={post.link}>
        <Link className={styles.journalPhoto} href={post.link} aria-label={'Read ' + post.title}><SiteImage src={post.image} alt={post.title} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 400px" /></Link>
        <div className={styles.journalMeta}>MIRPUR &amp; MORE<span>TRAVEL NOTES</span></div>
        <h3><Link href={post.link}>{post.title}</Link></h3><p>{post.excerpt}</p><Link className={styles.textLink} href={post.link} aria-label={'Read ' + post.title}>Read the story<Arrow /></Link>
      </article>)}</div>
    </section>}

    <section className={styles.visit}>
      <div><p className={styles.eyebrow}>WE’LL SEE YOU IN MIRPUR</p><h2>{home.cta?.title || 'Ready to plan your stay?'}</h2><p>Choose your dates. Find your room. Leave the rest to a conversation with our team.</p></div>
      <div className={styles.visitActions}><Link className={styles.lightButton} href={home.cta?.href || '/book-now'}>{home.cta?.label || 'Book your stay'}<Arrow diagonal /></Link>{whatsapp && <a className={styles.whatsappLink} href={whatsapp} target="_blank" rel="noreferrer">Have a question? Chat on WhatsApp<Arrow /></a>}</div>
    </section>
  </main>;
}
