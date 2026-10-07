import Layout from '../components/Layout';
import '../styles/style.css';
import '../styles/gallery.css';
import '../styles/roomDetail.css';
import '../styles/admin.css';

export default function MyApp({ Component, pageProps, router }) {
  const isAdmin = router.pathname.startsWith('/admin');

  if (isAdmin) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
