import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { resolveServiceApiBase } from "@/lib/service-url";

const TELEMEDICINE_API = resolveServiceApiBase("telemedicine");
const APPOINTMENT_API = resolveServiceApiBase("appointment");
const MAILTRAP_DEMO_RECIPIENT = "sanirurajapaksha456@gmail.com";

type SessionLookupResult = { ok: true; data: Record<string, unknown> } | { ok: false; status: number; data: unknown };

function isClientError(status: number): boolean {
    return status >= 400 && status < 500;
}

function extractMessage(payload: unknown): string {
    if (typeof payload === "string") return payload;
    if (typeof payload !== "object" || payload === null) return "";

    const maybeMessage = (payload as Record<string, unknown>).message;
    if (typeof maybeMessage === "string") return maybeMessage;
    if (Array.isArray(maybeMessage) && maybeMessage.length > 0) {
        return String(maybeMessage[0]);
    }
    return "";
}

function escapeHtml(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatDateTime(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(parsed);
}

function asObject(value: unknown): Record<string, unknown> | null {
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

async function readJsonSafely(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function resolveTelemedicineSession(identifier: string, headers: HeadersInit, createIfMissing: boolean): Promise<SessionLookupResult> {
    const fetchByAppointment = async () =>
        fetch(`${TELEMEDICINE_API}/sessions/appointment/${identifier}`, {
            method: "GET",
            headers,
        });

    const fetchBySessionId = async () =>
        fetch(`${TELEMEDICINE_API}/sessions/${identifier}`, {
            method: "GET",
            headers,
        });

    const createFromAppointment = async () =>
        fetch(`${TELEMEDICINE_API}/sessions`, {
            method: "POST",
            headers,
            body: JSON.stringify({ appointmentId: identifier }),
        });

    let response = await fetchByAppointment();

    if (!response.ok && isClientError(response.status)) {
        const bySession = await fetchBySessionId();
        if (bySession.ok) {
            response = bySession;
        } else if (createIfMissing && isClientError(bySession.status)) {
            const createResponse = await createFromAppointment();
            // 400 can happen when a session was created in parallel.
            if (createResponse.ok || createResponse.status === 400) {
                response = await fetchByAppointment();
            } else {
                response = createResponse;
            }
        } else {
            response = bySession;
        }
    }

    if (!response.ok) {
        return {
            ok: false,
            status: response.status,
            data: await readJsonSafely(response),
        };
    }

    const data = asObject(await readJsonSafely(response));
    if (!data || typeof data.id !== "string" || typeof data.appointmentId !== "string") {
        return {
            ok: false,
            status: 502,
            data: { error: "Invalid session payload returned by telemedicine service" },
        };
    }

    return { ok: true, data };
}

function toTelemedicineSessionContract(data: Record<string, unknown>) {
    const deriveStatus = (): string => {
        if (data.endedAt) return "COMPLETED";
        if (data.startedAt) return "STARTED";
        return "SCHEDULED";
    };

    return {
        sessionId: data.id,
        appointmentId: data.appointmentId,
        doctorName: typeof data.doctorName === "string" ? data.doctorName : "Doctor",
        patientName: typeof data.patientName === "string" ? data.patientName : "Patient",
        scheduledAt: typeof data.startedAt === "string" ? data.startedAt : new Date().toISOString(),
        status: deriveStatus(),
        meetingUrl: typeof data.jitsiUrl === "string" ? data.jitsiUrl : "",
    };
}

/**
 * The FE links to /telemedicine/{appointmentId} so the param coming in is an
 * appointment ID.  We try the appointment-based lookup first; if the value
 * happens to be a session UUID we fall back to the session-by-id endpoint so
 * both paths work.
 *
 * The backend SessionResponse shape differs from what the FE page expects, so
 * we transform the response into the TelemedicineSession contract:
 *   { sessionId, appointmentId, doctorName, patientName, scheduledAt, status, meetingUrl }
 */
export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = session.tokenSet.accessToken;

        if (!token) {
            return NextResponse.json({ error: "Token missing" }, { status: 401 });
        }

        const resolvedParams = await params;
        const { sessionId } = resolvedParams;

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const lookup = await resolveTelemedicineSession(sessionId, headers, true);
        if (!lookup.ok) {
            return NextResponse.json(lookup.data, { status: lookup.status });
        }

        const transformed = toTelemedicineSessionContract(lookup.data);

        return NextResponse.json(transformed, { status: 200 });
    } catch (error) {
        console.error("Error proxying telemedicine session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = session.tokenSet.accessToken;
        if (!token) {
            return NextResponse.json({ error: "Token missing" }, { status: 401 });
        }

        const { sessionId } = await params;
        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const lookup = await resolveTelemedicineSession(sessionId, headers, false);
        if (!lookup.ok) {
            return NextResponse.json(lookup.data, { status: lookup.status });
        }

        const resolvedSessionId = lookup.data.id as string;
        const appointmentId = lookup.data.appointmentId as string;

        const endResponse = await fetch(`${TELEMEDICINE_API}/sessions/${resolvedSessionId}/end`, {
            method: "PATCH",
            headers,
        });
        const endPayload = await readJsonSafely(endResponse);
        if (!endResponse.ok) {
            const message = extractMessage(endPayload);
            const isAlreadyEnded = endResponse.status === 400 && /already ended/i.test(message);
            if (!isAlreadyEnded) {
                return NextResponse.json(endPayload, { status: endResponse.status });
            }
        }

        const appointmentResponse = await fetch(`${APPOINTMENT_API}/appointments/${appointmentId}/status`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "COMPLETED" }),
        });
        const appointmentPayload = await readJsonSafely(appointmentResponse);
        if (!appointmentResponse.ok) {
            return NextResponse.json(appointmentPayload, { status: appointmentResponse.status });
        }

        const appointment = asObject(appointmentPayload) ?? {};
        const patientId = typeof appointment.patientId === "string" ? appointment.patientId : "";
        const doctorId = typeof appointment.doctorId === "string" ? appointment.doctorId : "";
        const patientNameRaw = typeof lookup.data.patientName === "string" ? lookup.data.patientName : "Patient";
        const doctorNameRaw = typeof lookup.data.doctorName === "string" ? lookup.data.doctorName : "your doctor";
        const appointmentDateRaw =
            (typeof appointment.appointmentDate === "string" && appointment.appointmentDate) ||
            (typeof appointment.date === "string" && appointment.date) ||
            "";
        const appointmentTimeRaw =
            (typeof appointment.appointmentTime === "string" && appointment.appointmentTime) ||
            (typeof appointment.time === "string" && appointment.time) ||
            "";
        const consultationTypeRaw =
            (typeof appointment.type === "string" && appointment.type) ||
            (typeof appointment.consultationType === "string" && appointment.consultationType) ||
            "Telemedicine";

        const patientName = escapeHtml(patientNameRaw.trim() || "Patient");
        const doctorName = escapeHtml(doctorNameRaw.trim() || "your doctor");
        const consultationType = escapeHtml(consultationTypeRaw.toUpperCase());
        const appointmentDateLabel = appointmentDateRaw ? escapeHtml(formatDateTime(appointmentDateRaw)) : "Not available";
        const appointmentTimeLabel = appointmentTimeRaw ? escapeHtml(appointmentTimeRaw) : "Not available";
        const completedAtLabel = escapeHtml(formatDateTime(new Date().toISOString()));
        const safeAppointmentId = escapeHtml(appointmentId);

        // Mailtrap demo setup: force all completion emails to the verified inbox recipient.
        const recipientEmail = MAILTRAP_DEMO_RECIPIENT;

        const mailContent = `
            <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                <h2 style="margin: 0 0 12px; color: #0f766e;">Your telemedicine session is complete</h2>
                <p style="margin: 0 0 12px;">Hi ${patientName},</p>
                <p style="margin: 0 0 12px;">
                    Your consultation with <strong>${doctorName}</strong> has ended successfully.
                    The appointment is now marked as <strong>COMPLETED</strong>.
                </p>

                <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <p style="margin: 0 0 6px;"><strong>Appointment ID:</strong> ${safeAppointmentId}</p>
                    <p style="margin: 0 0 6px;"><strong>Consultation type:</strong> ${consultationType}</p>
                    <p style="margin: 0 0 6px;"><strong>Appointment date:</strong> ${appointmentDateLabel}</p>
                    <p style="margin: 0 0 6px;"><strong>Appointment time:</strong> ${appointmentTimeLabel}</p>
                    <p style="margin: 0;"><strong>Completed at:</strong> ${completedAtLabel}</p>
                </div>

                <p style="margin: 0 0 8px;">
                    You can sign in to ezClinic to review your appointment history and continue your care journey.
                </p>
                <p style="margin: 0 0 12px;">
                    If your symptoms worsen, please book a follow-up appointment or seek urgent medical care.
                </p>
                <p style="margin: 0;">Thank you for using ezClinic.</p>
            </div>
        `;

        const sendResponse = await fetch(`${TELEMEDICINE_API}/notifications/send`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                userId: patientId || doctorId || session.user.sub || "unknown-user",
                recipientEmail,
                type: "EMAIL",
                subject: "Telemedicine Session Completed — ezClinic",
                content: mailContent,
            }),
        });
        const notificationPayload = await readJsonSafely(sendResponse);
        if (!sendResponse.ok) {
            return NextResponse.json(notificationPayload, { status: sendResponse.status });
        }

        return NextResponse.json(
            {
                success: true,
                sessionId: resolvedSessionId,
                appointmentId,
                appointmentStatus: appointment.status ?? "COMPLETED",
                emailTriggered: true,
                emailAlreadySent: false,
                notification: notificationPayload,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error ending telemedicine session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
