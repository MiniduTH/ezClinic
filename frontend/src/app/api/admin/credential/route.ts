import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie } from '@/lib/auth';

const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_API || 'http://localhost:3002/api/v1';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    if (!path || !path.startsWith('/uploads/credentials/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Obtain server-side access token from the httpOnly session cookie
    const accessToken = await getTokenFromCookie();
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Build full URL to doctor service static file endpoint
    const base = DOCTOR_API.replace('/api/v1', '');
    const fileUrl = `${base}${path}`;

    // Fetch the file with authorization
    const res = await fetch(fileUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Failed to fetch file', detail: text }, { status: res.status });
    }

    // Stream back the response, preserving content-type
    const headers: Record<string, string> = {};
    const contentType = res.headers.get('content-type');
    if (contentType) headers['content-type'] = contentType;
    const body = await res.arrayBuffer();
    return new NextResponse(Buffer.from(body), { headers });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
