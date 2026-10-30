import Link from 'next/link';
import SiteImage from '../components/SiteImage';
import { publicPage } from '../lib/publicPage.js';
import { PageHeading, PageCTA, SectionHeading } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
export async function getStaticProps(context) { return publicPage(context, 'site'); }
export default function About({ data }) {
  const about = data.about;
  return <main className={s.page}>
    <PageHeading eyebrow="About Lotus Inn" title={about.intro?.title || 'A warm welcome to Mirpur.'} text={about.intro?.text} image={about.intro?.images?.[0]} imageAlt="Inside Lotus Inn Guest House"><div className={s.heroActions}><Link href={about.intro?.buttonHref || '/rooms'} className={s.button}>{about.intro?.buttonLabel || 'Explore our rooms'} <span aria-hidden="true">↗</span></Link></div></PageHeading>
    <div className={s.wrap}>
      <section className={s.featureBand}><div><p className={s.eyebrow}>THOUGHTFUL BY NATURE</p><h2>{about.amenities?.title}</h2></div><div className={s.featureGrid}>{(about.amenities?.items || []).map((item,i) => <div className={s.feature} key={i}><i className={item.icon} aria-hidden="true"/><span>{item.label}</span></div>)}</div></section>
      <section className={s.story}><SiteImage className={s.storyPhoto} src={about.hospitality?.image || about.intro?.images?.[1]} alt="Hospitality at Lotus Inn"/><div className={s.storyCopy}><p className={s.eyebrow}>FEEL AT HOME</p><h2>{about.hospitality?.title}</h2><p>{about.hospitality?.text}</p><ul className={s.checkList}>{(about.hospitality?.items || []).map(item => <li key={item}>{item}</li>)}</ul><div className={s.heroActions}><Link href="/contact" className={s.textLink}>Get to know us <span aria-hidden="true">↗</span></Link></div></div></section>
      {about.testimonial?.text && <figure className={s.quote}><p className={s.eyebrow}>A WORD FROM OUR GUESTS</p><blockquote>“{about.testimonial.text}”</blockquote><figcaption>{about.testimonial.name}</figcaption></figure>}
      <section className={s.section}><SectionHeading eyebrow="A LOOK INSIDE" title={about.gallery?.title || 'Your next stay, in pictures.'}><Link href="/gallery" className={s.textLink}>View the gallery <span aria-hidden="true">↗</span></Link></SectionHeading><div className={s.imageStrip}>{(about.gallery?.images || []).slice(0,3).map((image,i) => <Link href="/gallery" key={image}><SiteImage src={image} alt={`Inside Lotus Inn Guest House, view ${i+1}`} /></Link>)}</div></section>
    </div><PageCTA />
  </main>;
}
