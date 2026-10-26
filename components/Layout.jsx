import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Layout({ children }) {
  const [siteData, setSiteData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/site-data?dataset=site')
      .then((res) => { if (!res.ok) throw new Error('Unable to load website content.'); return res.json(); })
      .then(setSiteData)
      .catch((err) => console.error('Failed to load site data:', err));
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const header = siteData?.layout?.header;
  const footer = siteData?.layout?.footer;

  return (
    <>
      <header className="header">
        <div className="nav">
          <h2 className="logo">
            <Link href="/" onClick={closeMenu}>
              <img
                src={header?.logo || '/images/LotusInnLogo.png'}
                alt="Lotus Inn Guest House"
              />
            </Link>
          </h2>

<button
            type="button"
            className={`mobile-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div
            className={`mobile-menu-overlay ${menuOpen ? 'show' : ''}`}
            onClick={closeMenu}
            aria-hidden="true"
          ></div>

          <nav className={`menu ${menuOpen ? 'show' : ''}`} aria-label="Main navigation">
            <div className="mobile-menu-logo">
              <img src="/images/LotusInnLogo.png" alt="Lotus Inn" />
            </div>
            {(header?.menu || []).map((item) => (
              <Link key={item.path} href={item.path} onClick={closeMenu}>
                {item.label}
              </Link>
            ))}

            <Link
              href={header?.bookNow?.href || '/book-now'}
              className="btn"
              onClick={closeMenu}
            >
              {header?.bookNow?.label || 'Book Now'}
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="footer">
        <div className="footer-top">
          <div>
            <h4>Quick Links</h4>
            {(footer?.quickLinks || []).map((item, index) => (
              <Link key={`${item.label}-${index}`} href={item.href}>
                <p>{item.label}</p>
              </Link>
            ))}
          </div>

          <div>
            <h4>Contact Us</h4>
            <p>
              <strong>Address:</strong>{' '}
              {footer?.contact?.address ? (
                <>
                  {footer.contact.address.split(', ').slice(0, 2).join(', ')}
                  <br />
                  {footer.contact.address.split(', ').slice(2).join(', ')}
                </>
              ) : (
                ''
              )}
            </p>

            <p>
              <strong>Phone:</strong> {footer?.contact?.phone || ''}
            </p>
            <p>
              <strong>Land Line:</strong> {footer?.contact?.landline || ''}
            </p>

            <p>
              <strong>Email:</strong> {footer?.contact?.email || ''}
            </p>
          </div>

          <div>
            <h4>Follow Us</h4>
            <div className="socials">
              {(footer?.socials || []).map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Social link ${index + 1}`}
                >
                  <i className={item.icon}></i>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">{footer?.copyright || ''}</div>
      </footer>
    </>
  );
}