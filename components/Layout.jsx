import { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SiteImage, { optimizedImageUrl, imageSourceSet } from './SiteImage';
import styles from '../styles/public.module.css';
import homeStyles from '../styles/Home.module.css';
import Footer from './Footer';
import theme from '../styles/PublicTheme.module.css';

export default function Layout({ children, initialLayout, images }) {
  const { pathname } = useRouter();
  const [siteData, setSiteData] = useState(() => initialLayout ? { layout: initialLayout } : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === '/';

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (initialLayout) { setSiteData({ layout: initialLayout }); return; }
    fetch('/api/site-data?dataset=site')
      .then((res) => { if (!res.ok) throw new Error('Unable to load website content.'); return res.json(); })
      .then(setSiteData)
      .catch((err) => console.error('Failed to load site data:', err));
  }, [initialLayout]);

  const closeMenu = () => setMenuOpen(false);

  const header = siteData?.layout?.header;
  const footer = siteData?.layout?.footer;
  const banner = images?.hero;

  return (
    <div className={[isHome ? styles.surface : '', homeStyles.homeShell, theme.publicSite].filter(Boolean).join(' ')}><div className="site-shell" style={images ? {
      '--site-hero-image': `url(${JSON.stringify(optimizedImageUrl(images.hero))})`,
      '--booking-hero-image': `url(${JSON.stringify(optimizedImageUrl(images.bookingHero))})`,
      '--contact-hero-image': `url(${JSON.stringify(optimizedImageUrl(images.contactHero))})`,
    } : undefined}>
      {banner && isHome && <Head><link rel="preload" as="image" href={optimizedImageUrl(banner)} imageSrcSet={imageSourceSet(banner)} imageSizes="(max-width: 760px) 100vw, 1400px" /></Head>}
      <div className={!isHome ? `${styles.surface} ${theme.headerFrame}` : undefined}><header className="header">
        <div className="nav">
          <h2 className="logo">
            <Link href="/" onClick={closeMenu}>
              <SiteImage
                src={header?.logo || '/images/LotusInnLogo.png'}
                alt="Lotus Inn Guest House" loading="eager" sizes="160px"
              />
            </Link>
          </h2>

<button
            type="button"
            className={`mobile-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
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

          <nav id="main-navigation" className={`menu ${menuOpen ? 'show' : ''}`} aria-label="Main navigation">
            <div className="mobile-menu-logo">
              <SiteImage src={header?.logo || '/images/LotusInnLogo.png'} alt="Lotus Inn" sizes="160px" />
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
      </header></div>

      {children}

      <Footer footer={footer} logo={header?.logo} />
    </div></div>
  );
}
