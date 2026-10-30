import Link from 'next/link';
import SiteImage from './SiteImage';
import { isSocialProfileUrl } from '../lib/seo.js';
import styles from '../styles/Footer.module.css';

function socialLabel(href) {
  if (/facebook/.test(href)) return 'Facebook';
  if (/instagram/.test(href)) return 'Instagram';
  if (/wa.me|whatsapp/.test(href)) return 'WhatsApp';
  if (/x.com|twitter.com/.test(href)) return 'X';
  return 'Social profile';
}

export default function Footer({ footer, logo }) {
  const contact = footer?.contact || {};
  return (
    <footer className={styles.footer} aria-label="Website footer">
      <div className={styles.columns}>
        <div className={styles.brand}>
          <Link href="/" aria-label="Lotus Inn home"><SiteImage src={logo || '/images/LotusInnLogo.png'} alt="Lotus Inn Guest House" sizes="190px" /></Link>
          <p>A comfortable place to stay in Mirpur. We look forward to welcoming you.</p>
          <Link className={styles.book} href="/book-now">Plan your stay <span aria-hidden="true">↗</span></Link>
        </div>
        <nav aria-label="Footer navigation">
          <h2>Explore Lotus Inn</h2>
          {(footer?.quickLinks || []).map((item, index) => <Link key={`${item.href}-${index}`} href={item.href}>{item.label}</Link>)}
        </nav>
        <div>
          <h2>Get in touch</h2>
          {contact.address && <p className={styles.address}><i className="fa-solid fa-location-dot" aria-hidden="true" /><span>{contact.address}</span></p>}
          {contact.phone && <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><i className="fa-solid fa-phone" aria-hidden="true" />{contact.phone}</a>}
          {contact.landline && <a href={`tel:${contact.landline.replace(/[^+\d]/g, '')}`}><i className="fa-solid fa-phone" aria-hidden="true" />{contact.landline}</a>}
          {contact.email && <a href={`mailto:${contact.email}`}><i className="fa-solid fa-envelope" aria-hidden="true" />{contact.email}</a>}
        </div>
        <div>
          <h2>Stay connected</h2>
          <div className={styles.socials}>
            {(footer?.socials || []).filter(item => isSocialProfileUrl(item.href)).map((item, index) => (
              <a key={`${item.href}-${index}`} href={item.href} target="_blank" rel="noreferrer" aria-label={`Lotus Inn on ${socialLabel(item.href)}`}><i className={item.icon} aria-hidden="true" /><span>{socialLabel(item.href)}</span></a>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.bottom}>{footer?.copyright || '© Lotus Inn Guest House. All rights reserved.'}</div>
    </footer>
  );
}
