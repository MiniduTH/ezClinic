import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

const KONG_BASE = process.env.INTERNAL_KONG_URL || 'http://localhost:8000';
const API_BASE = `${KONG_BASE}/api/v1`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, role: rawRole = 'patient' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    // Validate role to prevent privilege escalation
    const role: 'patient' | 'doctor' | 'admin' =
      rawRole === 'doctor' ? 'doctor' : rawRole === 'admin' ? 'admin' : 'patient';

    const serviceUrl =
      role === 'doctor'
        ? `${API_BASE}/doctors/auth/login`
        : role === 'admin'
        ? `${API_BASE}/auth/admin/login`
        : `${API_BASE}/auth/login`;

    const res = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Invalid credentials' },
        { status: res.status },
      );
    }

    const token: string = data.token;
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
