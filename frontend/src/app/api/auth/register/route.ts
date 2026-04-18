import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { resolveServiceApiBase } from '@/lib/service-url';

const PATIENT_API = resolveServiceApiBase('patient');
const DOCTOR_API = resolveServiceApiBase('doctor');

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
