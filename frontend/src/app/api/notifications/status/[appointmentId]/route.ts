import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveServiceApiBase } from '@/lib/service-url';

const TELEMEDICINE_API = resolveServiceApiBase('telemedicine');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = session.tokenSet.accessToken;

    if (!token) {
      return NextResponse.json({ error: 'Token missing' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { appointmentId } = resolvedParams;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const response = await fetch(`${TELEMEDICINE_API}/notifications/status/${appointmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error proxying notification status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
