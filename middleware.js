import { NextResponse } from 'next/server';

const COOKIE = 'lotus_admin_session';
const PASSWORD = process.env.ADMIN_PASSWORD || 'LotusInn@2026!';
const SECRET = process.env.ADMIN_SESSION_SECRET || 'lotus-inn-admin-session-secret-change-me';

async function expectedToken() {
  const bytes = new TextEncoder().encode(`${PASSWORD}:${SECRET}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  const expected = await expectedToken();
  if (token === expected) return NextResponse.next();

  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.json({ message: 'Admin authentication required.' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
