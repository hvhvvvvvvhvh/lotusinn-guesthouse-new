import dynamic from 'next/dynamic';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect, useState } from 'react';
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
  return <><AppContent {...props} /><PerformanceInsights route={props.router.pathname} /></>;
}

function PerformanceInsights({ route }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // Some existing projects do not expose Vercel's NEXT_PUBLIC system variables.
    setEnabled(process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' || window.location.hostname === 'lotusinn-guesthouse-new.vercel.app');
  }, []);
  return enabled ? <SpeedInsights route={route} beforeSend={sanitizeMetric} debug={false} /> : null;
}
