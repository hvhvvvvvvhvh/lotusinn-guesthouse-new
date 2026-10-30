import Head from 'next/head';
import { pageSeo, serializeJsonLd, BUSINESS_NAME, SITE_ORIGIN } from '../lib/seo.js';
import { optimizedImageUrl } from './SiteImage';

export default function Seo({ route, pageProps, asPath }) {
  const seo = pageSeo(route, pageProps, asPath);
  const source = seo.image?.startsWith(`${SITE_ORIGIN}/`) ? seo.image.slice(SITE_ORIGIN.length) : seo.image;
  const image = source ? new URL(optimizedImageUrl(source), SITE_ORIGIN).href : undefined;
  return <Head>
    <title>{seo.title}</title>
    <meta name="description" content={seo.description} key="description" />
    <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" key="favicon-png" />
    <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32 48x48 64x64" key="favicon-ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" key="apple-touch-icon" />
    <link rel="manifest" href="/site.webmanifest" key="manifest" />
    <meta name="theme-color" content="#075c43" key="theme-color" />
    <meta name="application-name" content={BUSINESS_NAME} key="application-name" />
    {route === '/' && <meta name="google-site-verification" content="_h2LMAks5Cv_8zsL1qCD1n5PjLO229EiG-F1eXbbLqQ" key="google-site-verification" />}
    <meta name="robots" content={seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} key="robots" />
    {!seo.noindex && <link rel="canonical" href={seo.canonical} key="canonical" />}
    {!seo.noindex && <meta property="og:url" content={seo.canonical} key="og:url" />}
    <meta property="og:title" content={seo.title} key="og:title" />
    <meta property="og:description" content={seo.description} key="og:description" />
    <meta property="og:type" content={seo.type} key="og:type" />
    <meta property="og:site_name" content={BUSINESS_NAME} key="og:site_name" />
    <meta property="og:locale" content="en_PK" key="og:locale" />
    {image && <meta property="og:image" content={image} key="og:image" />}
    {image && <meta property="og:image:alt" content={seo.imageAlt} key="og:image:alt" />}
    {seo.imageWidth && <meta property="og:image:width" content={String(seo.imageWidth)} key="og:image:width" />}
    {seo.imageHeight && <meta property="og:image:height" content={String(seo.imageHeight)} key="og:image:height" />}
    {seo.imageType && <meta property="og:image:type" content={seo.imageType} key="og:image:type" />}
    <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} key="twitter:card" />
    <meta name="twitter:title" content={seo.title} key="twitter:title" />
    <meta name="twitter:description" content={seo.description} key="twitter:description" />
    {image && <meta name="twitter:image" content={image} key="twitter:image" />}
    {image && <meta name="twitter:image:alt" content={seo.imageAlt} key="twitter:image:alt" />}
    {!seo.noindex && <script id="site-structured-data" key="site-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(seo.structuredData) }} />}
  </Head>;
}
