import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

function resolveTelemedicineBaseUrl(): string {
  const rawBaseUrl =
    process.env.TELEMEDICINE_SERVICE_URL ||
    process.env.NEXT_PUBLIC_TELEMEDICINE_API ||
    'http://localhost:8090';
  const normalized = rawBaseUrl.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

async function safeReadJson(response: Response, context: string) {
  try {
    return await response.json();
  } catch (error) {
    console.warn(`Telemedicine proxy: non-JSON ${context} response`, error);
    return { error: `${context} response was not valid JSON` };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth0.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await auth0.getAccessToken();

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { sessionId } = resolvedParams;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const backendUrl = resolveTelemedicineBaseUrl();

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    const sessionResponse = await fetch(`${backendUrl}/sessions/${sessionId}`, {
      method: 'GET',
      headers,
    });

    if (sessionResponse.ok) {
      const data = await safeReadJson(sessionResponse, 'session lookup');
      return NextResponse.json(data, { status: 200 });
    }

    if (sessionResponse.status !== 404) {
      const data = await safeReadJson(sessionResponse, 'session lookup');
      return NextResponse.json(data, { status: sessionResponse.status });
    }

    const appointmentResponse = await fetch(`${backendUrl}/sessions/appointment/${sessionId}`, {
      method: 'GET',
      headers,
    });

    const data = await safeReadJson(appointmentResponse, 'appointment lookup');
    if (!appointmentResponse.ok) {
      return NextResponse.json(data, { status: appointmentResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error proxying telemedicine session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
