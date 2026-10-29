import Link from 'next/link';
import SiteImage from '../components/SiteImage';
import { cachePublicPage } from '../lib/publicPage.js';
import { withImageDefaults } from '../lib/imageSlots.js';
import { publicDataset } from '../lib/publicDataset.js';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { readPublicJson } from '../lib/publicStore.js';
import { getPublicBlogs as getBlogs } from '../lib/publicBlogStore.js';
import { publicBlog } from '../lib/publicContent.js';

export async function getStaticProps(context) {
  const [site, rooms, blogs] = await Promise.all([readPublicJson('site'), readPublicJson('rooms'), getBlogs()]);
  cachePublicPage(context.res);
  const publicSite = publicDataset(withImageDefaults(site), 'site');
  const publicRooms = publicDataset(rooms, 'rooms');
  const seen = new Set();
  const posts = blogs.filter(blog => blog.status === 'Published').sort((a,b) => String(b.publishDate).localeCompare(String(a.publishDate))).filter(blog => { if (seen.has(blog.slug)) return false; seen.add(blog.slug); return true; }).slice(0, 3);
  return { revalidate: 60, props: { siteLayout: publicSite.layout, siteImages: publicSite.images, data: { home: { ...publicSite.home,
    rooms: { ...site.home.rooms, cards: publicRooms.roomsPage.availableRooms.slice(0, 3).map(room => ({ image: room.image, title: room.title, price: room.price, link: `/room/${room.slug}`, linkLabel: 'View Details' })) },
    blog: { ...site.home.blog, posts: posts.map(blog => ({ title: blog.title, excerpt: blog.excerpt || '', image: publicBlog(blog).featuredImage || '/images/DSC_0271.JPG', link: `/blog/${blog.slug}`, linkLabel: 'Read More' })) },
  } } } };
}

export default function Home({ data }) {
  const router = useRouter();
  const [dates, setDates] = useState({ checkIn: '', checkOut: '', guests: '2' });
  const updateDates = (name, event) => {
    const value = event.target.value;
    setDates(previous => ({ ...previous, [name]: value }));
  };

  const home = data?.home;

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <h1 dangerouslySetInnerHTML={{ __html: home?.hero?.title || '' }} />
          <p>{home?.hero?.subtitle}</p>

          <form className="booking-bar" onSubmit={event => { event.preventDefault(); router.push({ pathname: '/book-now', query: dates }); }}>
            <input aria-label="Check-in date" type="date" value={dates.checkIn} onChange={event => updateDates('checkIn', event)} />
            <input aria-label="Check-out date" type="date" min={dates.checkIn || undefined} value={dates.checkOut} onChange={event => updateDates('checkOut', event)} />
            <input aria-label="Number of guests" type="number" min="1" max="50" value={dates.guests} onChange={event => updateDates('guests', event)} />
            <button type="submit">
              {home?.hero?.bookingButton?.label || 'Check Availability'}
            </button>
          </form>
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
              <SiteImage src={room.image} alt={room.title} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 360px" />
              <h3>{room.title}</h3>
              <p>{room.price}</p>
              <Link href={room.link}>{room.linkLabel}</Link>
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
            <SiteImage key={index} src={image} alt={`Gallery ${index + 1}`} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 300px" />
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
                    <SiteImage src={review.image} alt={review.name} sizes="100px" />
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
              <SiteImage src={post.image} alt={post.title} sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 360px" />
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <Link href={post.link}>{post.linkLabel}</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <h2 className="section-title">{home?.cta?.title}</h2>
        <Link href={home?.cta?.href || '/book-now'}>{home?.cta?.label}</Link>
      </section>
    </>
  );
}
