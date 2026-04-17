import { getTokenFromCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const token = await getTokenFromCookie();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ accessToken: token });
}
