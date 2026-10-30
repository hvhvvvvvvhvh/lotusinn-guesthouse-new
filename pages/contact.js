import Link from 'next/link';
import { PageHeading, PageCTA } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
import f from '../styles/FormPages.module.css';
import { publicPage } from '../lib/publicPage.js';
export async function getStaticProps(context) { return publicPage(context, 'site'); }
import { useMemo, useRef, useState } from 'react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  subject: 'General Inquiry',
  message: ''
};

export default function Contact({ data: initialData }) {
  const data = initialData.contactPage;
  const sending = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({ ...initialForm, subject: initialData.contactPage?.form?.subjects?.[0] || initialForm.subject }));
  const [status, setStatus] = useState({ type: '', message: '' });


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
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save message');
      return true;
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error.message || 'Message could not be saved right now. Please try again.' });
      return false;
    }
  };

  const sendByEmail = async () => {
    if (!document.querySelector('form').reportValidity() || !validateForm()) return;
    if (sending.current) return;
    sending.current = true;
    setSubmitting(true);
    const saved = await saveMessage();
    sending.current = false;
    setSubmitting(false);
    if (!saved) { return; }

    const subject = encodeURIComponent(`${form.subject} - ${form.fullName}`);
    const body = encodeURIComponent(buildMessage());
    window.location.href = `mailto:${contactValues.emailRecipient}?subject=${subject}&body=${body}`;
    setStatus({ type: 'success', message: 'Message saved and your email app is opening with the contact message.' });
  };

  const sendByWhatsApp = async () => {
    if (!document.querySelector('form').reportValidity() || !validateForm()) return;
    if (sending.current) return;
    sending.current = true;
    setSubmitting(true);
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    const saved = await saveMessage();
    sending.current = false;
    setSubmitting(false);
    if (!saved) { popup?.close(); return; }

    const message = encodeURIComponent(buildMessage());
    const whatsappUrl = `https://wa.me/${contactValues.whatsappNumber}?text=${message}`;
    if (popup) popup.location.replace(whatsappUrl);
    else window.location.assign(whatsappUrl);
    setStatus({ type: 'success', message: 'Message saved and WhatsApp is opening with your message.' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendByEmail();
  };

  return <main className={s.page}><div className={f.formPage}>
    <PageHeading eyebrow="Get in touch" title={data.hero?.title || 'We’d love to hear from you.'} text="Ask about a room, plan your visit, or let us know how we can help."/>
    <div className={`${s.wrap} ${s.section} ${f.layout}`}>
      <section className={f.formCard} aria-labelledby="contact-form-title"><p className={s.eyebrow}>LET’S TALK</p><h2 id="contact-form-title">Send us a message</h2><p className={f.formIntro}>Share your details and we’ll help with your inquiry.</p>
      <form className="contact-form-grid" onSubmit={handleSubmit}>
                <div className="contact-field">
                  <label htmlFor="fullName">Full Name</label>
                  <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" required />
                </div>

                <div className="contact-field">
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Enter your phone number" required />
                </div>

                <div className="contact-field">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email address" required />
                </div>

                <div className="contact-field">
                  <label htmlFor="subject">Subject</label>
                  <select id="subject" name="subject" value={form.subject} onChange={handleChange}>
                    {(data?.form?.subjects || []).map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div className="contact-field contact-field-full">
                  <label htmlFor="message">Your Message</label>
                  <textarea id="message" name="message" value={form.message} onChange={handleChange} rows="6" placeholder="Write your message here" required />
                </div>

                {status.message ? (
                  <div role="status" className={`contact-status ${status.type === 'error' ? 'contact-status-error' : 'contact-status-success'} contact-field-full`}>
                    {status.message}
                  </div>
                ) : null}

                <div className="contact-action-row contact-field-full">
                  <button className="contact-submit-btn" type="submit" disabled={submitting}>
                    <i className="fa-solid fa-envelope"></i>
                    <span>Send by Email</span>
                  </button>

                  <button className="contact-submit-btn contact-submit-btn-secondary" type="button" onClick={sendByWhatsApp} disabled={submitting}>
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
              </form>
      </section>
      <aside className={f.sideCard}><p className={s.eyebrow}>LOTUS INN, MIRPUR</p><h2>Come say hello.</h2><ul className={f.contactList}>{(data.cards || []).map((item,i) => <li key={i}><i className={item.icon} aria-hidden="true"/><div><h3>{item.title}</h3>{/@/.test(item.text) ? <a href={`mailto:${item.text}`}>{item.text}</a> : /^\+?[\d\s()-]+$/.test(item.text) ? <a href={`tel:${item.text.replace(/[^+\d]/g,'')}`}>{item.text}</a> : <p>{item.text}</p>}</div></li>)}</ul><a href={contactValues.mapUrl} className={s.button} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a><div className={f.divider}/><h3>When to reach us</h3><dl className={f.hours}>{(data.businessHours?.rows || []).map((item,i) => <div key={i}><dt>{item.day}</dt><dd>{item.time}</dd></div>)}</dl><a href={`https://wa.me/${contactValues.whatsappNumber}`} className={s.textLink} target="_blank" rel="noreferrer">Chat on WhatsApp <span aria-hidden="true">↗</span></a></aside>
    </div>
  </div><PageCTA title="Looking for your next stay?" href="/rooms" label="Explore our rooms"/></main>;
}
