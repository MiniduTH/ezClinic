import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import EndSessionButton from "@/components/telemedicine/EndSessionButton";

type SessionStatus = "SCHEDULED" | "STARTED" | "COMPLETED" | "CANCELLED";

interface TelemedicineSession {
    sessionId: string;
    appointmentId: string;
    doctorName: string;
    patientName: string;
    scheduledAt: string;
    status: SessionStatus;
    meetingUrl: string;
}

export default async function TelemedicineSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
    const { sessionId } = await params;
    let sessionData: TelemedicineSession | null = null;
    let fetchError = false;

    try {
        const headersList = await headers();
        const cookieString = headersList.get("cookie") || "";
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
        const baseUrl = process.env.APP_BASE_URL || `${protocol}://${host}`;

        const res = await fetch(`${baseUrl}/api/telemedicine/${sessionId}`, {
            method: "GET",
            headers: {
                cookie: cookieString,
            },
            cache: "no-store",
        });

        if (res.ok) {
            sessionData = await res.json();
        } else {
            fetchError = true;
            console.error(`Failed to fetch session. Status: ${res.status}`);
        }
    } catch (error) {
        console.error("Error in TelemedicineSessionPage server fetch:", error);
        fetchError = true;
    }

    if (fetchError || !sessionData) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg-surface)" }}>
                <div
                    className="w-full max-w-md p-10 text-center rounded-xl border"
                    style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                    }}
                >
                    <div
                        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                        style={{ background: "var(--danger-surface)" }}
                    >
                        <svg
                            width="26"
                            height="26"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ color: "var(--danger)" }}
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                        Session Not Found
                    </h1>
                    <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
                        Unable to load telemedicine session details or the session does not exist.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center w-full h-11 rounded-lg text-sm font-medium"
                        style={{ background: "var(--brand)", color: "#ffffff" }}
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(sessionData.scheduledAt));

    const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(sessionData.scheduledAt));

    const getStatusStyle = (status: SessionStatus): React.CSSProperties => {
        switch (status) {
            case "SCHEDULED":
                return { background: "var(--accent-surface)", color: "var(--warning-text)", border: "1px solid var(--warning-border)" };
            case "STARTED":
                return { background: "var(--brand-surface)", color: "var(--brand-text)", border: "1px solid var(--brand-border)" };
            case "COMPLETED":
                return { background: "var(--bg-muted)", color: "var(--text-secondary)" };
            case "CANCELLED":
                return { background: "var(--danger-surface)", color: "var(--danger-text)", border: "1px solid var(--danger-border)" };
            default:
                return { background: "var(--bg-muted)", color: "var(--text-secondary)" };
        }
    };

    const showIframe = sessionData.status === "SCHEDULED" || sessionData.status === "STARTED";
    const viewerSession = await getSession();
    const canEndSession = getUserRole(viewerSession) === "doctor" && showIframe;

    return (
        <div className="min-h-screen" style={{ background: "var(--bg-surface)" }}>
            <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-5">
                {/* Session info bar */}
                <div
                    className="rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--brand-surface)" }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: "var(--brand)" }}
                            >
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                                Virtual Consultation
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                                <span>
                                    <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Dr. {sessionData.doctorName}</span>
                                    {" · "}
                                    Patient: {sessionData.patientName}
                                </span>
                                <span>{formattedDate}</span>
                                <span>{formattedTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={getStatusStyle(sessionData.status)}>
                            {sessionData.status}
                        </span>
                        {canEndSession && <EndSessionButton sessionRef={sessionId} />}
                        <Link
                            href="/dashboard"
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                            style={{
                                borderColor: "var(--border)",
                                color: "var(--text-secondary)",
                                background: "transparent",
                            }}
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>

                {/* Video area */}
                <div
                    className="rounded-xl border overflow-hidden"
                    style={{
                        background: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                        minHeight: "600px",
                    }}
                >
                    {showIframe && sessionData.meetingUrl ? (
                        <iframe
                            src={sessionData.meetingUrl}
                            allow="camera; microphone; fullscreen; display-capture"
                            style={{ width: "100%", height: "650px", border: "none", display: "block" }}
                            title={`Telemedicine session for ${sessionData.patientName}`}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center" style={{ minHeight: "600px" }}>
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                                style={{
                                    background: sessionData.status === "COMPLETED" ? "var(--bg-muted)" : "var(--danger-surface)",
                                }}
                            >
                                {sessionData.status === "COMPLETED" ? (
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        style={{ color: "var(--text-muted)" }}
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="28"
                                        height="28"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        style={{ color: "var(--danger)" }}
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold mb-2 capitalize" style={{ color: "var(--text-primary)" }}>
                                Session {sessionData.status.toLowerCase()}
                            </h2>
                            <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
                                This telemedicine session has been {sessionData.status.toLowerCase()}. The meeting room is no longer available.
                            </p>
                            <Link
                                href="/appointments"
                                className="mt-6 inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-medium"
                                style={{ background: "var(--brand)", color: "#ffffff" }}
                            >
                                View Appointments
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
