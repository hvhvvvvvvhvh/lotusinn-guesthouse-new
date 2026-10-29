import dynamic from 'next/dynamic';
import { SpeedInsights } from '@vercel/speed-insights/next';
import NavigationProgress from '../components/NavigationProgress';
import AdminPage from '../components/AdminPage';
import '../styles/fonts.css';
import '../styles/icons.css';
import '../styles/shared.css';

const Layout = dynamic(() => import('../components/Layout'));
const AdminShell = dynamic(() => import('../components/AdminLayout').then(module => module.AdminShell));

function AppContent({ Component, pageProps, router }) {
  const isAdmin = router.pathname.startsWith('/admin');

  if (isAdmin) {
    return <><NavigationProgress /><AdminShell login={router.pathname === '/admin/login'}>{router.pathname === '/admin/login' ? <Component {...pageProps} /> : <AdminPage Component={Component} path={router.asPath} />}</AdminShell></>;
  }

  return (
    <Layout initialLayout={pageProps.siteLayout || pageProps.data?.layout} images={pageProps.siteImages}>
      <NavigationProgress />
      <Component {...pageProps} />
    </Layout>
  );
}

function sanitizeMetric(event) {
  const url = new URL(event.url);
  url.search = '';
  url.hash = '';
  return { ...event, url: url.href };
}
export default function MyApp(props) {
  return <><AppContent {...props} />{process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && <SpeedInsights route={props.router.pathname} beforeSend={sanitizeMetric} debug={false} />}</>;
}
