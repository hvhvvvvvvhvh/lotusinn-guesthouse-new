import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { cachedAdminPage, loadAdminPage, connectAdminCache } from '../lib/adminClient.js';

function Pagination({ pagination }) {
  const router = useRouter();
  const [search, setSearch] = useState(pagination.search);
  const { page, pageSize, total } = pagination;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const navigate = number => router.push({ pathname: router.pathname, query: { ...router.query, page: number } });
  return <nav className="admin-pagination" aria-label="Record pages">
    <form onSubmit={event => { event.preventDefault(); router.push({ pathname: router.pathname, query: { q: search, page: 1 } }); }}>
      <input aria-label="Search all records" placeholder="Search all records" value={search} onChange={event => setSearch(event.target.value)} />
      <button type="submit" className="admin-btn">Search</button>
    </form>
    <span>{total} records · Page {page} of {pages}</span>
    <button type="button" className="admin-btn admin-btn-outline" disabled={page <= 1} onClick={() => navigate(page - 1)}>Previous</button>
    <button type="button" className="admin-btn admin-btn-outline" disabled={page >= pages} onClick={() => navigate(page + 1)}>Next</button>
  </nav>;
}
function LoadedPage({ Component, path }) {
  const [state, setState] = useState(() => ({ data: cachedAdminPage(path), error: '' }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    loadAdminPage(path).then(data => { if (active) setState({ data, error: '' }); }, error => { if (active) setState({ data: null, error: error.message }); });
    return () => { active = false; };
  }, [path, attempt]);
  if (state.error) return <div className="admin-panel" role="alert"><p>{state.error}</p><button className="admin-btn" onClick={() => { setState({ data: null, error: '' }); setAttempt(value => value + 1); }}>Try again</button></div>;
  if (!state.data) return <div className="admin-panel admin-loading" role="status" aria-live="polite"><span className="admin-loading-bar" /><p>Loading page…</p></div>;
  return <><Component {...state.data} />{state.data.pagination && <Pagination pagination={state.data.pagination} />}</>;
}
export default function AdminPage({ Component, path }) {
  useEffect(connectAdminCache, []);
  return <LoadedPage key={path} Component={Component} path={path} />;
}
