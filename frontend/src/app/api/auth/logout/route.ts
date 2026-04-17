import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  await clearSessionCookie();
  // Redirect to /login on the same origin
  const url = new URL('/login', request.nextUrl.origin);
  return NextResponse.redirect(url);
}
