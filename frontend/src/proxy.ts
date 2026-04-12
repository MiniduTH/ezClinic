import { auth0 } from './lib/auth0';

export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/dashboard/:path*',
    '/patients/:path*',
    '/prescriptions/:path*',
    '/availability/:path*',
    '/telemedicine/:path*',
    '/admin/:path*',
  ],
};
