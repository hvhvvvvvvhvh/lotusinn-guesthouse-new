import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

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

export default function BookNow() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [prefilledRoom, setPrefilledRoom] = useState(null);

  useEffect(() => {
    fetch('/data/siteData.json')
      .then((res) => res.json())
      .then((json) => {
        setData(json.bookingPage);
        setForm((prev) => ({
          ...prev,
          roomType: prev.roomType || json.bookingPage?.form?.roomTypes?.[0] || 'Deluxe Room',
          guests: json.bookingPage?.form?.guestOptions?.[1] || prev.guests
        }));
      })
      .catch((err) => {
        console.error('Failed to load booking page data:', err);
        setStatus({ type: 'error', message: 'Booking details could not be loaded. Please refresh the page.' });
      });
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const room = typeof router.query.room === 'string' ? router.query.room : '';
    const price = typeof router.query.price === 'string' ? router.query.price : '';
    const slug = typeof router.query.slug === 'string' ? router.query.slug : '';
    const tag = typeof router.query.tag === 'string' ? router.query.tag : '';

    if (room) {
      setPrefilledRoom({ title: room, price, slug, tag });
      setForm((prev) => ({ ...prev, roomType: room }));
      setStatus({
        type: 'success',
        message: `${room}${price ? ` (${price})` : ''} has been selected for your booking.`
      });
    }
  }, [router.isReady, router.query.room, router.query.price, router.query.slug, router.query.tag]);

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
    const payload = { ...form, roomPrice: selectedRoom?.price || '' };
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save booking');
      return true;
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Booking could not be saved right now. Please try again.' });
      return false;
    }
  };

  const sendViaWhatsApp = async () => {
    if (!validateForm()) return;
    const saved = await saveBooking();
    if (!saved) return;

    const message = encodeURIComponent(buildBookingMessage());
    const whatsappUrl = `https://wa.me/${contactValues.whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setStatus({ type: 'success', message: 'Booking saved and WhatsApp is opening with your booking details.' });
  };

  const sendViaEmail = async () => {
    if (!validateForm()) return;
    const saved = await saveBooking();
    if (!saved) return;

    const subject = encodeURIComponent(`Booking Request - ${form.fullName}`);
    const body = encodeURIComponent(buildBookingMessage());
    window.location.href = `mailto:${contactValues.emailRecipient}?subject=${subject}&body=${body}`;
    setStatus({ type: 'success', message: 'Booking saved and your email app is opening with the booking request.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendViaWhatsApp();
  };

  return (
    <>
      <section className="hero room-hero page-hero-common">
        <div className="hero-content booking-hero-content">
            <span className="booking-kicker">{data?.hero?.kicker}</span>
            <h1>{data?.hero?.title}</h1>
            <p>{data?.hero?.subtitle}</p>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <section className="booking-page">
        <div className="booking-shell">
          <div className="booking-main-card">
            <div className="booking-copy">
              <span className="booking-mini-title">{data?.intro?.label}</span>
              <h2>{data?.intro?.title}</h2>
              <p>{data?.intro?.text}</p>

              <div className="booking-feature-list">
                {(data?.highlights || []).map((item, index) => (
                  <div className="booking-feature-item" key={index}>
                    <div className="booking-icon-wrap">
                      <i className={item.icon}></i>
                    </div>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="booking-form-card">
              <div className="booking-form-head">
                <h3>{data?.form?.title}</h3>
                <p>{data?.form?.subtitle}</p>
              </div>

              <form className="booking-form-grid" onSubmit={handleSubmit}>
                <div className="booking-field">
                  <label>Check In</label>
                  <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} required />
                </div>

                <div className="booking-field">
                  <label>Check Out</label>
                  <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} required />
                </div>

                <div className="booking-field">
                  <label>Guests</label>
                  <select name="guests" value={form.guests} onChange={handleChange}>
                    {(data?.form?.guestOptions || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="booking-field">
                  <label>Room Type</label>
                  <select name="roomType" value={form.roomType} onChange={handleChange}>
                    {prefilledRoom?.title && !(data?.form?.roomTypes || []).includes(prefilledRoom.title) ? (
                      <option value={prefilledRoom.title}>{prefilledRoom.title}</option>
                    ) : null}
                    {(data?.form?.roomTypes || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div className="booking-field booking-field-full">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required />
                </div>

                <div className="booking-field">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="03xx xxx xxxx" required />
                </div>

                <div className="booking-field">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                </div>

                <div className="booking-field booking-field-full">
                  <label>Special Requests</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows="4" placeholder="Airport pickup, early check-in, extra bed, etc."></textarea>
                </div>

                {status.message ? (
                  <div className={`booking-status booking-status-${status.type || 'info'}`}>
                    {status.message}
                  </div>
                ) : null}

                <div className="booking-action-row booking-field-full">
                  <button className="booking-submit-btn" type="submit">
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Send on WhatsApp</span>
                  </button>

                  <button className="booking-submit-btn booking-submit-btn-secondary" type="button" onClick={sendViaEmail}>
                    <i className="fa-solid fa-envelope"></i>
                    <span>Send by Email</span>
                  </button>
                </div>

                <p className="booking-disclaimer booking-field-full">
                  Your booking details will open directly in WhatsApp or your email app for quick sending.
                </p>
              </form>
            </div>
          </div>

          <div className="booking-bottom-grid">
            <div className="booking-pricing-card">
              <div className="booking-section-head">
                <span>{data?.pricing?.label}</span>
                <h3>{data?.pricing?.title}</h3>
              </div>

              <div className="booking-rate-grid">
                {prefilledRoom?.title && !(data?.pricingCards || []).some((item) => item.title === prefilledRoom.title) ? (
                  <div className="booking-rate-item active">
                    <div>
                      <h4>{prefilledRoom.title}</h4>
                      <p>{prefilledRoom.tag ? `${prefilledRoom.tag} selected from rooms page.` : 'Selected from rooms page.'}</p>
                    </div>
                    <strong>{prefilledRoom.price}</strong>
                  </div>
                ) : null}
                {(data?.pricingCards || []).map((item, index) => (
                  <div className={`booking-rate-item ${selectedRoom?.title === item.title ? 'active' : ''}`} key={index}>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.text}</p>
                    </div>
                    <strong>{item.price}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="booking-side-stack">
              <div className="booking-info-panel">
                <div className="booking-section-head">
                  <span>{data?.whyChoose?.label}</span>
                  <h3>{data?.whyChoose?.title}</h3>
                </div>
                <div className="booking-badges">
                  {(data?.whyChoose?.items || []).map((item, index) => (
                    <div className="booking-badge" key={index}>
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="booking-contact-panel">
                <h3>{data?.contactCard?.title}</h3>
                <p>{data?.contactCard?.text}</p>
                <div className="booking-contact-list">
                  {(data?.contactCard?.items || []).map((item, index) => (
                    <div className="booking-contact-item" key={index}>
                      <i className={item.icon}></i>
                      <span>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="booking-contact-actions">
                  <a href={`https://wa.me/${contactValues.whatsappNumber}`} target="_blank" rel="noreferrer" className="booking-contact-link">
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Chat on WhatsApp</span>
                  </a>
                  <a href={`mailto:${contactValues.emailRecipient}`} className="booking-contact-link booking-contact-link-outline">
                    <i className="fa-solid fa-envelope"></i>
                    <span>Email Us</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
