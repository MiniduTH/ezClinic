import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'ezclinic_session';

const PROTECTED_PATTERNS = [
  '/dashboard',
  '/patients',
  '/prescriptions',
  '/availability',
  '/telemedicine',
  '/admin',
  '/profile',
  '/reports',
  '/appointments',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and auth pages
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PATTERNS.some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const loginPath = pathname.startsWith('/admin') ? '/admin-login' : '/login';
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/patients/:path*',
    '/prescriptions/:path*',
    '/availability/:path*',
    '/telemedicine/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/reports/:path*',
    '/appointments/:path*',
  ],
};
