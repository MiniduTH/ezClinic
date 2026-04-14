import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(request: Request) {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Attempt to retrieve access token securely
    const { token } = await auth0.getAccessToken();

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const body = await request.json();

    const backendUrl = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:8090';
    
    const response = await fetch(`${backendUrl}/api/symptom-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ symptoms: body.symptoms }),
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
