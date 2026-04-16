import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';

const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || 'http://localhost:3005/api/v1';
const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || 'http://localhost:3002/api/v1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role: rawRole = 'patient', ...fields } = body;

    // Validate role to prevent privilege escalation
    const role: 'patient' | 'doctor' =
      rawRole === 'doctor' ? 'doctor' : 'patient';

    const serviceUrl =
      role === 'doctor'
        ? `${DOCTOR_API}/auth/register`
        : `${PATIENT_API}/auth/register`;

    const res = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Registration failed' },
        { status: res.status },
      );
    }

    const token: string = data.token;
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user: data.user }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
