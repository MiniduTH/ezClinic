import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveServiceApiBase } from '@/lib/service-url';

const TELEMEDICINE_API = resolveServiceApiBase('telemedicine');

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.tokenSet.accessToken;

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${TELEMEDICINE_API}/symptom-checks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ patientId: session.user.sub, symptoms: body.symptoms }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error proxying symptom check:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
