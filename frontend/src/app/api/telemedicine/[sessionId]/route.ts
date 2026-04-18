import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { resolveServiceApiBase } from '@/lib/service-url';

const TELEMEDICINE_API = resolveServiceApiBase('telemedicine');

/**
 * The FE links to /telemedicine/{appointmentId} so the param coming in is an
 * appointment ID.  We try the appointment-based lookup first; if the value
 * happens to be a session UUID we fall back to the session-by-id endpoint so
 * both paths work.
 *
 * The backend SessionResponse shape differs from what the FE page expects, so
 * we transform the response into the TelemedicineSession contract:
 *   { sessionId, doctorName, patientName, scheduledAt, status, meetingUrl }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
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
    const { sessionId } = resolvedParams;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Try appointment-based lookup first (most common path from FE)
    let response = await fetch(
      `${TELEMEDICINE_API}/sessions/appointment/${sessionId}`,
      { method: 'GET', headers }
    );

    // Fall back to session-by-id if appointment lookup returned 4xx
    if (!response.ok && response.status >= 400 && response.status < 500) {
      response = await fetch(`${TELEMEDICINE_API}/sessions/${sessionId}`, {
        method: 'GET',
        headers,
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Transform backend SessionResponse → FE TelemedicineSession contract
    const deriveStatus = (): string => {
      if (data.endedAt) return 'COMPLETED';
      if (data.startedAt) return 'STARTED';
      return 'SCHEDULED';
    };

    const transformed = {
      sessionId: data.id,
      doctorName: data.doctorName ?? 'Doctor',
      patientName: data.patientName ?? 'Patient',
      scheduledAt: data.startedAt ?? new Date().toISOString(),
      status: deriveStatus(),
      meetingUrl: data.jitsiUrl ?? '',
    };

    return NextResponse.json(transformed, { status: 200 });
  } catch (error) {
    console.error('Error proxying telemedicine session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
