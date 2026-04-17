import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

function resolveTelemedicineBaseUrl(): string {
    const rawBaseUrl = process.env.TELEMEDICINE_SERVICE_URL || process.env.NEXT_PUBLIC_TELEMEDICINE_API || "http://localhost:8090";
    const normalized = rawBaseUrl.replace(/\/+$/, "");
    return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
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
        const { appointmentId } = resolvedParams;

        if (!appointmentId) {
            return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 });
        }

        const backendUrl = resolveTelemedicineBaseUrl();
        const response = await fetch(`${backendUrl}/sessions/appointment/${appointmentId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.ok) {
            const data = await response.json().catch(() => null);
            return NextResponse.json({ live: true, session: data }, { status: 200 });
        }

        // Treat not-found/invalid-lookup as not live; this endpoint should never create sessions.
        if (response.status === 400 || response.status === 404) {
            return NextResponse.json({ live: false }, { status: 200 });
        }

        return NextResponse.json({ live: false, error: "Unable to determine session status" }, { status: response.status });
    } catch (error) {
        console.error("Error checking telemedicine session status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
