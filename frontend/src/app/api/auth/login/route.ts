import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || 'http://localhost:3005/api/v1';
const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || 'http://localhost:3002/api/v1';

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
    const role: 'patient' | 'doctor' =
      rawRole === 'doctor' ? 'doctor' : 'patient';

    const serviceUrl =
      role === 'doctor' ? `${DOCTOR_API}/auth/login` : `${PATIENT_API}/auth/login`;

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
