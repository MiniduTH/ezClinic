import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

function resolveTelemedicineBaseUrl(): string {
  const rawBaseUrl =
    process.env.TELEMEDICINE_SERVICE_URL ||
    process.env.NEXT_PUBLIC_TELEMEDICINE_API ||
    'http://localhost:8090';
  const normalized = rawBaseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

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

    const backendUrl = resolveTelemedicineBaseUrl();
    
    const response = await fetch(`${backendUrl}/symptom-checks`, {
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
