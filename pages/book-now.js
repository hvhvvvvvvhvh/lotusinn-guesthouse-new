import Link from 'next/link';
import { PageHeading } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
import f from '../styles/FormPages.module.css';
import { withImageDefaults } from '../lib/imageSlots.js';
import { publicDataset } from '../lib/publicDataset.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { readPublicJson } from '../lib/publicStore.js';

export async function getStaticProps() {
  const [site, rooms] = await Promise.all([readPublicJson('site'), readPublicJson('rooms')]);
  const listed = rooms.roomsPage.availableRooms;
  const publicSite = publicDataset(withImageDefaults(site), 'site');
  return { revalidate: 60, props: { siteLayout: publicSite.layout, siteImages: publicSite.images, bookingData: { ...site.bookingPage, form: { ...site.bookingPage.form, roomTypes: listed.map(room => room.title) }, pricingCards: listed.map(room => ({ title: room.title, price: room.price, text: room.description || room.text || '', slug: room.slug })) } } };
}

const initialForm = {
  checkIn: '',
  checkOut: '',
  guests: '2',
  roomType: 'Deluxe Room',
  fullName: '',
  phone: '',
  email: '',
  notes: ''
};

export default function BookNow({ bookingData }) {
  const router = useRouter();
  const data = bookingData;
  const sending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({ ...initialForm, roomType: bookingData.form.roomTypes[0] || '' }));
  const [status, setStatus] = useState({ type: '', message: '' });
  const [prefilledRoom, setPrefilledRoom] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const { checkIn, checkOut, guests } = router.query;
    setForm(previous => ({ ...previous,
      ...(typeof checkIn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(checkIn) ? { checkIn } : {}),
      ...(typeof checkOut === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(checkOut) ? { checkOut } : {}),
      ...(typeof guests === 'string' && /^\d+$/.test(guests) && Number(guests) >= 1 && Number(guests) <= 50 ? { guests } : {}),
    }));
  }, [router.isReady, router.query.checkIn, router.query.checkOut, router.query.guests]);

  useEffect(() => {
    if (!router.isReady) return;
    const room = typeof router.query.room === 'string' ? router.query.room : '';
    const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
    const tag = typeof router.query.tag === 'string' ? router.query.tag : '';

    if (room) {
      const listed = data.pricingCards.find(item => slug ? item.slug === slug : item.title === room);
      if (!listed) {
        setStatus({ type: 'error', message: 'That room is no longer listed. Please choose an available room.' });
        return;
      }
      setPrefilledRoom({ ...listed, tag });
      setForm((prev) => ({ ...prev, roomType: listed.title }));
      setStatus({
        type: 'success',
        message: `${listed.title}${listed.price ? ` (${listed.price})` : ''} has been selected for your booking.`
      });
    }
  }, [router.isReady, router.query.room, router.query.price, router.query.slug, router.query.tag, data]);

  const selectedRoom = useMemo(() => {
    const match = (data?.pricingCards || []).find((item) => item.title === form.roomType);
    if (match) return match;
    if (prefilledRoom?.title === form.roomType) {
      return {
        title: prefilledRoom.title,
        text: prefilledRoom.tag ? `${prefilledRoom.tag} selected from rooms page.` : 'Selected from rooms page.',
        price: prefilledRoom.price || ''
      };
    }
    return data?.pricingCards?.[0];
  }, [data, form.roomType, prefilledRoom]);

  const contactValues = useMemo(() => {
    const items = data?.contactCard?.items || [];
    const phoneValue = items.find((item) => /phone/i.test(item.icon) || /^\+?\d/.test(item.value || ''))?.value || '+92 123 456 7890';
    const emailValue = items.find((item) => /envelope|mail/i.test(item.icon) || /@/.test(item.value || ''))?.value || 'info@lotusinn.com';
    return {
      phoneDisplay: phoneValue,
      whatsappNumber: String(phoneValue).replace(/[^\d]/g, ''),
      emailRecipient: emailValue
    };
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.checkIn || !form.checkOut || !form.fullName || !form.phone || !form.email) {
      setStatus({ type: 'error', message: 'Please fill all required booking details before sending your request.' });
      return false;
    }

    const checkInDate = new Date(form.checkIn);
    const checkOutDate = new Date(form.checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      setStatus({ type: 'error', message: 'Please select valid check-in and check-out dates.' });
      return false;
    }

    if (checkOutDate <= checkInDate) {
      setStatus({ type: 'error', message: 'Check-out date must be later than check-in date.' });
      return false;
    }

    setStatus({ type: '', message: '' });
    return true;
  };

  const buildBookingMessage = () => {
    const roomLine = selectedRoom?.price ? `${form.roomType} (${selectedRoom.price})` : form.roomType;

    return [
      'Booking Request - Lotus Inn',
      '',
      `Full Name: ${form.fullName}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Check In: ${form.checkIn}`,
      `Check Out: ${form.checkOut}`,
      `Guests: ${form.guests}`,
      `Room Type: ${roomLine}`,
      `Special Requests: ${form.notes || 'None'}`
    ].join('\n');
  };

  const saveBooking = async () => {
    const payload = { ...form, roomSlug: selectedRoom?.slug || (prefilledRoom?.title === form.roomType ? prefilledRoom.slug : '') || '' };
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save booking');
      return true;
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'Booking could not be saved right now. Please try again.' });
      return false;
    }
  };

  const sendViaWhatsApp = async () => {
    if (!document.querySelector('form').reportValidity() || !validateForm()) return;
    if (sending.current) return;
    sending.current = true;
    setSubmitting(true);
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    const saved = await saveBooking();
    sending.current = false;
    setSubmitting(false);
    if (!saved) { popup?.close(); return; }

    const message = encodeURIComponent(buildBookingMessage());
    const whatsappUrl = `https://wa.me/${contactValues.whatsappNumber}?text=${message}`;

    if (popup) popup.location.replace(whatsappUrl);
    else window.location.assign(whatsappUrl);
    setStatus({ type: 'success', message: 'Booking saved and WhatsApp is opening with your booking details.' });
  };

  const sendViaEmail = async () => {
    if (!document.querySelector('form').reportValidity() || !validateForm()) return;
    if (sending.current) return;
    sending.current = true;
    setSubmitting(true);
    const saved = await saveBooking();
    sending.current = false;
    setSubmitting(false);
    if (!saved) { return; }

    const subject = encodeURIComponent(`Booking Request - ${form.fullName}`);
    const body = encodeURIComponent(buildBookingMessage());
    window.location.href = `mailto:${contactValues.emailRecipient}?subject=${subject}&body=${body}`;
    setStatus({ type: 'success', message: 'Booking saved and your email app is opening with the booking request.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendViaWhatsApp();
  };

  return <main className={s.page}><div className={f.formPage}>
    <PageHeading eyebrow="Book your stay" title={data.hero?.title || 'Plan your stay in Mirpur.'} text="Choose your room and dates, then send your request. Our team will help with the rest."/>
    <div className={`${s.wrap} ${s.section} ${f.layout}`}>
      <section className={f.formCard} aria-labelledby="booking-form-title"><p className={s.eyebrow}>YOUR NEXT STAY</p><h2 id="booking-form-title">Your stay details</h2><p className={f.formIntro}>Enter your dates and contact details below.</p>
      <form className="booking-form-grid" onSubmit={handleSubmit}>
                <div className="booking-field">
                  <label htmlFor="checkIn">Check In</label>
                  <input type="date" id="checkIn" name="checkIn" value={form.checkIn} onChange={handleChange} required />
                </div>

                <div className="booking-field">
                  <label htmlFor="checkOut">Check Out</label>
                  <input type="date" id="checkOut" name="checkOut" value={form.checkOut} onChange={handleChange} required />
                </div>

                <div className="booking-field">
                  <label htmlFor="guests">Guests</label>
                  <select id="guests" name="guests" value={form.guests} onChange={handleChange}>
                    {!(data?.form?.guestOptions || []).some(item => String(item).replace('+', '') === String(form.guests)) && <option value={form.guests}>{form.guests}</option>}
                    {(data?.form?.guestOptions || []).map((item) => (
                      <option key={item} value={String(item).replace('+', '')}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="booking-field">
                  <label htmlFor="roomType">Room Type</label>
                  <select id="roomType" name="roomType" value={form.roomType} onChange={handleChange}>
                    {prefilledRoom?.title && !(data?.form?.roomTypes || []).includes(prefilledRoom.title) ? (
                      <option value={prefilledRoom.title}>{prefilledRoom.title}</option>
                    ) : null}
                    {(data?.form?.roomTypes || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="booking-field booking-field-full">
                  <label htmlFor="fullName">Full Name</label>
                  <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required />
                </div>

                <div className="booking-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="03xx xxx xxxx" required />
                </div>

                <div className="booking-field">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                </div>

                <div className="booking-field booking-field-full">
                  <label htmlFor="notes">Special requests (optional)</label>
                  <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Airport pickup, early check-in, extra bed, etc."></textarea>
                </div>

                {status.message ? (
                  <div role="status" className={`booking-status booking-status-${status.type || 'info'}`}>
                    {status.message}
                  </div>
                ) : null}

                <div className="booking-action-row booking-field-full">
                  <button className="booking-submit-btn" type="submit" disabled={submitting}>
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Send on WhatsApp</span>
                  </button>

                  <button className="booking-submit-btn booking-submit-btn-secondary" type="button" onClick={sendViaEmail} disabled={submitting}>
                    <i className="fa-solid fa-envelope"></i>
                    <span>Send by Email</span>
                  </button>
                </div>

                <p className="booking-disclaimer booking-field-full">
                  Send your request to our team. Your stay is confirmed once availability has been checked.
                </p>
              </form>
      </section>
      <aside className={f.sideCard} aria-label="Your selected room"><p className={s.eyebrow}>YOUR ROOM</p><h2>{selectedRoom?.title || 'Stay at Lotus Inn'}</h2><p className={f.price}>{selectedRoom?.price}</p><p>{selectedRoom?.text}</p><div className={f.divider}/><h3>A simple way to book</h3><ol className={f.steps}><li>Choose your dates and room.</li><li>Send your request by WhatsApp or email.</li><li>Our team confirms availability with you.</li></ol><Link href="/rooms" className={s.textLink}>Compare our rooms <span aria-hidden="true">↗</span></Link><div className={f.divider}/><h3>Need a hand?</h3><p>We’re happy to help you plan your visit.</p><a className={s.outlineButton} href={`https://wa.me/${contactValues.whatsappNumber}`} target="_blank" rel="noreferrer"><i className="fa-brands fa-whatsapp" aria-hidden="true"/>Chat with our team</a><a className={f.phoneLink} href={`tel:${contactValues.phoneDisplay.replace(/[^+\d]/g,'')}`}>{contactValues.phoneDisplay}</a></aside>
    </div>
  </div></main>;
}
