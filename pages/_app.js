import Layout from '../components/Layout';
import NavigationProgress from '../components/NavigationProgress';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/poppins/800.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../styles/style.css';
import '../styles/gallery.css';
import '../styles/roomDetail.css';
import '../styles/admin.css';

export default function MyApp({ Component, pageProps, router }) {
  const isAdmin = router.pathname.startsWith('/admin');

  if (isAdmin) {
    return <><NavigationProgress /><Component key={router.asPath} {...pageProps} /></>;
  }

  return (
    <Layout initialLayout={pageProps.siteLayout || pageProps.data?.layout} images={pageProps.siteImages}>
      <NavigationProgress />
      <Component {...pageProps} />
    </Layout>
  );
}
