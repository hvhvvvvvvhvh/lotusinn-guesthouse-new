import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  subject: 'General Inquiry',
  message: ''
};

export default function Contact() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetch('/data/siteData.json')
      .then((res) => res.json())
      .then((json) => {
        const pageData = json.contactPage;
        setData(pageData);
        setForm((prev) => ({
          ...prev,
          subject: pageData?.form?.subjects?.[0] || prev.subject
        }));
      })
      .catch((err) => {
        console.error('Failed to load contact page data:', err);
        setStatus({ type: 'error', message: 'Contact details could not be loaded. Please refresh the page.' });
      });
  }, []);

  const contactValues = useMemo(() => {
    const cards = data?.cards || [];
    const phoneValue = cards.find((item) => /phone/i.test(item.title) || /^\+?\d/.test(item.text || ''))?.text || '+92 123 456 7890';
    const emailValue = cards.find((item) => /email/i.test(item.title) || /@/.test(item.text || ''))?.text || 'info@lotusinn.com';
    const mapUrl = data?.mapCard?.mapUrl || 'https://maps.google.com/';
    return {
      phoneDisplay: phoneValue,
      whatsappNumber: String(phoneValue).replace(/[^\d]/g, ''),
      emailRecipient: emailValue,
      mapUrl
    };
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!form.fullName || !form.phone || !form.email || !form.message) {
      setStatus({ type: 'error', message: 'Please fill all required contact details before sending your message.' });
      return false;
    }
    setStatus({ type: '', message: '' });
    return true;
  };

  const buildMessage = () => {
    return [
      'Contact Inquiry - Lotus Inn',
      '',
      `Name: ${form.fullName}`,
      `Phone: ${form.phone}`,
      `Email: ${form.email}`,
      `Subject: ${form.subject}`,
      '',
      'Message:',
      form.message
    ].join('\n');
  };

  const saveMessage = async () => {
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to save message');
      return true;
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Message could not be saved right now. Please try again.' });
      return false;
    }
  };

  const sendByEmail = async () => {
    if (!validateForm()) return;
    const saved = await saveMessage();
    if (!saved) return;

    const subject = encodeURIComponent(`${form.subject} - ${form.fullName}`);
    const body = encodeURIComponent(buildMessage());
    window.location.href = `mailto:${contactValues.emailRecipient}?subject=${subject}&body=${body}`;
    setStatus({ type: 'success', message: 'Message saved and your email app is opening with the contact message.' });
  };

  const sendByWhatsApp = async () => {
    if (!validateForm()) return;
    const saved = await saveMessage();
    if (!saved) return;

    const message = encodeURIComponent(buildMessage());
    const whatsappUrl = `https://wa.me/${contactValues.whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setStatus({ type: 'success', message: 'Message saved and WhatsApp is opening with your message.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendByEmail();
  };

  return (
    <>
      <section className="hero room-hero page-hero-common">
        <div className="hero-content contact-hero-content">
            <span className="contact-kicker">{data?.hero?.kicker}</span>
            <h1>{data?.hero?.title}</h1>
            <p>{data?.hero?.subtitle}</p>
        </div>
        <div className="bg_overlay"></div>
      </section>

      <section className="contact-page">
        <div className="contact-shell">
          <div className="contact-main-grid">
            <div className="contact-info-card">
              <span className="contact-mini-title">{data?.intro?.label}</span>
              <h2>{data?.intro?.title}</h2>
              <p>{data?.intro?.text}</p>

              <div className="contact-card-grid">
                {(data?.cards || []).map((item, index) => (
                  <div className="contact-mini-card" key={index}>
                    <div className="contact-icon-wrap">
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

            <div className="contact-form-card">
              <div className="contact-form-head">
                <h3>{data?.form?.title}</h3>
                <p>{data?.form?.subtitle}</p>
              </div>

              <form className="contact-form-grid" onSubmit={handleSubmit}>
                <div className="contact-field">
                  <label>Full Name</label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required />
                </div>

                <div className="contact-field">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" required />
                </div>

                <div className="contact-field">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" required />
                </div>

                <div className="contact-field">
                  <label>Subject</label>
                  <select name="subject" value={form.subject} onChange={handleChange}>
                    {(data?.form?.subjects || []).map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="contact-field contact-field-full">
                  <label>Your Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows="6" placeholder="Write your message here" required />
                </div>

                {status.message ? (
                  <div className={`contact-status ${status.type === 'error' ? 'contact-status-error' : 'contact-status-success'} contact-field-full`}>
                    {status.message}
                  </div>
                ) : null}

                <div className="contact-action-row contact-field-full">
                  <button className="contact-submit-btn" type="submit">
                    <i className="fa-solid fa-envelope"></i>
                    <span>Send by Email</span>
                  </button>

                  <button className="contact-submit-btn contact-submit-btn-secondary" type="button" onClick={sendByWhatsApp}>
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="contact-bottom-grid">
            <div className="contact-support-panel">
              <div className="contact-section-head">
                <span>{data?.detailsPanel?.label}</span>
                <h3>{data?.detailsPanel?.title}</h3>
              </div>

              <div className="contact-feature-list">
                {(data?.detailsPanel?.items || []).map((item, index) => (
                  <div className="contact-feature-item" key={index}>
                    <div className="contact-feature-icon">
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

            <div className="contact-side-stack">
              <div className="contact-hours-panel">
                <div className="contact-section-head">
                  <span>{data?.businessHours?.label}</span>
                  <h3>{data?.businessHours?.title}</h3>
                </div>

                <div className="contact-hours-list">
                  {(data?.businessHours?.rows || []).map((item, index) => (
                    <div className="contact-hours-row" key={index}>
                      <span>{item.day}</span>
                      <strong>{item.time}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="contact-map-panel">
                <div className="contact-section-head">
                  <span>{data?.mapCard?.label}</span>
                  <h3>{data?.mapCard?.title}</h3>
                </div>
                <p>{data?.mapCard?.text}</p>
                <div className="contact-map-placeholder">
                  <i className="fa-solid fa-map-location-dot"></i>
                  <span>Open location in Google Maps</span>
                </div>
                <div className="contact-quick-links">
                  <a href={contactValues.mapUrl} target="_blank" rel="noreferrer" className="contact-quick-link">
                    <i className="fa-solid fa-location-arrow"></i>
                    <span>Get Directions</span>
                  </a>
                  <a href={`tel:${contactValues.phoneDisplay}`} className="contact-quick-link contact-quick-link-outline">
                    <i className="fa-solid fa-phone"></i>
                    <span>Call Now</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-cta-strip">
            <div>
              <h3>{data?.cta?.title}</h3>
              <p>{data?.cta?.text}</p>
            </div>
            <div className="contact-cta-actions">
              <a href={data?.cta?.primaryHref || '/book-now'} className="contact-cta-btn">
                {data?.cta?.primaryLabel || 'Book Now'}
              </a>
              <a href={`https://wa.me/${contactValues.whatsappNumber}`} target="_blank" rel="noreferrer" className="contact-cta-btn contact-cta-btn-outline">
                {data?.cta?.secondaryLabel || 'Chat on WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
