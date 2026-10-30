import { publicPage } from '../lib/publicPage.js';
import { PageHeading, PageCTA, SectionHeading } from '../components/PublicPage';
import s from '../styles/PublicPages.module.css';
export async function getStaticProps(context) { return publicPage(context, 'rooms'); }
export default function AmenitiesPage({ data: initialData }) {
  const data = initialData.amenitiesPage;
  const groups = [
    { title:data.essentialTitle, text:data.essentialText, items:data.essential, label:'IN YOUR ROOM', icon:'fa-solid fa-bed' },
    { title:data.mealPlansTitle, text:data.mealPlansText, items:data.mealPlans, label:'AT YOUR TABLE', icon:'fa-solid fa-utensils' },
    { title:data.premiumTitle, text:data.premiumText, items:data.premium, label:'A LITTLE EXTRA', icon:'fa-solid fa-star' },
    { title:data.servicesTitle, text:data.servicesText, items:data.services, label:'HERE TO HELP', icon:'fa-solid fa-bell' },
  ];
  return <main className={s.page}><PageHeading eyebrow="Amenities & services" title={data.hero?.title} text={data.hero?.subtitle}/><div className={s.wrap}>{groups.map(group => <section key={group.label} className={s.section}><SectionHeading eyebrow={group.label} title={group.title} text={group.text}/><div className={s.amenityGrid}>{(group.items || []).map((item,i) => <article className={s.amenityRow} key={i}><i className={group.icon} aria-hidden="true"/><div><h3>{item.title}</h3><p>{item.text}</p></div>{item.price && <span className={s.amenityPrice}>{item.price}</span>}</article>)}</div></section>)}</div><PageCTA title={data.cta?.title} label={data.cta?.label} href={data.cta?.href} text="Let us know what you need when you send your stay request."/></main>;
}
