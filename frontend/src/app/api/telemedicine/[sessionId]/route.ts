import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

function resolveTelemedicineBaseUrl(): string {
    const rawBaseUrl = process.env.TELEMEDICINE_SERVICE_URL || process.env.NEXT_PUBLIC_TELEMEDICINE_API || "http://localhost:8090";
    const normalized = rawBaseUrl.replace(/\/+$/, "");
    return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function readJsonSafe(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        return { error: "Unexpected empty response from telemedicine service" };
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
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

        const backendUrl = resolveTelemedicineBaseUrl();
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        // UI currently passes appointmentId in the route param.
        // Prefer appointment-based lookup and fall back to direct session-id lookup.
        const appointmentResponse = await fetch(`${backendUrl}/sessions/appointment/${sessionId}`, {
            method: "GET",
            headers,
        });

        if (appointmentResponse.ok) {
            const appointmentData = await readJsonSafe(appointmentResponse);
            return NextResponse.json(appointmentData, { status: 200 });
        }

        const directResponse = await fetch(`${backendUrl}/sessions/${sessionId}`, {
            method: "GET",
            headers,
        });

        const directData = await readJsonSafe(directResponse);

        if (directResponse.ok) {
            return NextResponse.json(directData, { status: 200 });
        }

        // If there is no existing session yet and this looks like an appointment UUID,
        // create one on demand so first click from appointments works.
        if (isUuid(sessionId)) {
            const createResponse = await fetch(`${backendUrl}/sessions`, {
                method: "POST",
                headers,
                body: JSON.stringify({ appointmentId: sessionId }),
            });

            const createData = await readJsonSafe(createResponse);

            if (createResponse.ok) {
                return NextResponse.json(createData, { status: 200 });
            }

            // If creation reported a duplicate, read by appointment again (race-safe behavior).
            const duplicateMessage =
                typeof createData === "object" && createData !== null && "message" in createData
                    ? String((createData as { message?: unknown }).message)
                    : "";

            if (createResponse.status === 400 && duplicateMessage.toLowerCase().includes("already exists")) {
                const retryResponse = await fetch(`${backendUrl}/sessions/appointment/${sessionId}`, {
                    method: "GET",
                    headers,
                });

                const retryData = await readJsonSafe(retryResponse);
                if (retryResponse.ok) {
                    return NextResponse.json(retryData, { status: 200 });
                }
            }
        }

        return NextResponse.json(directData, { status: directResponse.status });
    } catch (error) {
        console.error("Error proxying telemedicine session:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
