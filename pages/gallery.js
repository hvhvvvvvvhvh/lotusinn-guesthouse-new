import { useEffect, useRef, useState } from 'react';
import SiteImage from '../components/SiteImage';
import { publicPage } from '../lib/publicPage.js';
import { PageHeading, PageCTA } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
export async function getStaticProps(context) { return publicPage(context, 'site'); }
export default function Gallery({ data }) {
  const page = data.galleryPage;
  const [filter, setFilter] = useState('all');
  const [popup, setPopup] = useState(null);
  const dialog = useRef(null);
  const images = (page.images || []).filter(image => filter === 'all' || image.category === filter);
  useEffect(() => {
    const node = dialog.current;
    if (!popup) { if (node?.open) node.close(); return; }
    if (!node.open) node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [popup]);
  return <main className={s.page}>
    <PageHeading eyebrow="The gallery" title={page.hero?.title} text={page.hero?.subtitle}/>
    <section className={`${s.wrap} ${s.section}`} aria-label="Guest house photographs">
      <div className={s.galleryTools}><div className={s.tabs} aria-label="Gallery categories">{(page.filters || []).map(item => <button key={item.value} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</div><p className={s.galleryCount} role="status">{images.length} photographs</p></div>
      <div className={s.photoGrid}>{images.map((image,i) => <button type="button" key={`${image.src}-${i}`} className={s.galleryButton} aria-label={`Open gallery image ${i+1}`} onClick={() => setPopup(image)}><SiteImage src={image.src} alt={`${image.category || 'Guest house'} at Lotus Inn, view ${i+1}`} sizes={i === 0 ? '(max-width: 760px) 100vw, 66vw' : '(max-width: 760px) 50vw, 33vw'}/><span aria-hidden="true">↗</span></button>)}</div>
      {!images.length && <div className={s.empty}><h2>No photographs in this category yet.</h2><p>Please choose another category.</p></div>}
    </section>
    <dialog ref={dialog} className={s.dialog} aria-label="Gallery image preview" onCancel={e => { e.preventDefault(); setPopup(null); }} onClose={() => setPopup(null)} onClick={e => { if (e.target === e.currentTarget) setPopup(null); }}><div className={s.dialogHead}><span>Lotus Inn Guest House</span><button type="button" autoFocus onClick={() => setPopup(null)}>Close ×</button></div>{popup && <SiteImage src={popup.src} alt={`${popup.category || 'Guest house'} at Lotus Inn`} sizes="100vw"/>}</dialog>
    <PageCTA title={page.cta?.title} label={page.cta?.label} href={page.cta?.href}/>
  </main>;
}
