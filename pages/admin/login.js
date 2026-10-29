import SiteImage from '../../components/SiteImage';
import Head from 'next/head';
import { useState } from 'react';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!password) return setError('Please enter your admin password.');
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to sign in.');
      const next = new URLSearchParams(window.location.search).get('next') || '/admin';
      window.location.href = next.startsWith('/admin') ? next : '/admin';
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin Login | Lotus Inn</title></Head>
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <SiteImage src="/images/LotusInnLogo.png" alt="Lotus Inn Guest House" onError={(e) => { e.currentTarget.src = '/images/lotusinn-logo.png'; }} />
            <span>LOTUS INN GUEST HOUSE</span>
          </div>
          <span className="admin-login-eyebrow">SECURE ADMIN ACCESS</span>
          <h1>Welcome back</h1>
          <p className="admin-login-intro">Sign in to manage blog posts, guest messages, bookings and website content.</p>
          <form onSubmit={submit} className="admin-login-form">
            <label htmlFor="admin-password">Admin Password</label>
            <div className="admin-password-wrap">
              <input id="admin-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" autoFocus />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}><i className={show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} /></button>
            </div>
            {error && <div className="admin-login-error" role="alert"><i className="fa-solid fa-circle-exclamation" />{error}</div>}
            <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Access Admin Panel'} <i className="fa-solid fa-arrow-right" /></button>
          </form>
          <a className="admin-login-back" href="/">← Back to website</a>
        </div>
      </main>
    </>
  );
}
