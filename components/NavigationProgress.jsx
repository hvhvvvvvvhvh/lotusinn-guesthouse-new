import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
export default function NavigationProgress() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState('');
  useEffect(() => {
    const start = () => { setPending(true); setFailed(''); };
    const complete = () => setPending(false);
    const error = (err, url) => { setPending(false); if (!err.cancelled) setFailed(url); };
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', complete);
    router.events.on('routeChangeError', error);
    return () => { router.events.off('routeChangeStart', start); router.events.off('routeChangeComplete', complete); router.events.off('routeChangeError', error); };
  }, [router.events]);
  if (failed) return <div role="alert" className="navigation-notice">The page could not be loaded. <a href={failed}>Try opening it again</a></div>;
  return pending ? <div className="navigation-progress" role="status" aria-live="polite"><span />Opening page…</div> : null;
}
