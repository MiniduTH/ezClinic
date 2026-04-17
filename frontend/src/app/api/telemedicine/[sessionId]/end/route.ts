import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

function resolveTelemedicineBaseUrl(): string {
    const rawBaseUrl = process.env.TELEMEDICINE_SERVICE_URL || process.env.NEXT_PUBLIC_TELEMEDICINE_API || "http://localhost:8090";
    const normalized = rawBaseUrl.replace(/\/+$/, "");
    return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
}

function resolveAppointmentBaseUrl(): string {
    const rawBaseUrl = process.env.APPOINTMENT_SERVICE_URL || process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004";
    const normalized = rawBaseUrl.replace(/\/+$/, "");
    return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
}

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
    try {
        const session = await getSession();
        if (!session?.tokenSet?.accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = session.tokenSet.accessToken;
        const { sessionId } = await params;
        const body = (await request.json().catch(() => ({}))) as { appointmentId?: string };
        const appointmentId = body.appointmentId;

        if (!sessionId || !appointmentId) {
            return NextResponse.json({ error: "sessionId and appointmentId are required" }, { status: 400 });
        }

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const telemedicineBase = resolveTelemedicineBaseUrl();
        const appointmentBase = resolveAppointmentBaseUrl();

        const endResponse = await fetch(`${telemedicineBase}/sessions/${sessionId}/end`, {
            method: "PATCH",
            headers,
        });

        const endData = await endResponse.json().catch(() => ({}));
        if (!endResponse.ok) {
            return NextResponse.json({ error: "Failed to end telemedicine session", details: endData }, { status: endResponse.status });
        }

        const completeResponse = await fetch(`${appointmentBase}/appointments/${appointmentId}/status`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ status: "COMPLETED" }),
        });

        const completeData = await completeResponse.json().catch(() => ({}));
        if (!completeResponse.ok) {
            return NextResponse.json(
                {
                    error: "Session ended, but appointment status update failed",
                    session: endData,
                    details: completeData,
                },
                { status: completeResponse.status },
            );
        }

        return NextResponse.json({ session: endData, appointment: completeData }, { status: 200 });
    } catch (error) {
        console.error("Error ending telemedicine session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
