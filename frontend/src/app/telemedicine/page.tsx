"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";
import Link from "next/link";
import { Video, Calendar, User, Clock, CheckCircle, Activity } from "lucide-react";

const APPOINTMENT_API = process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004/api/v1";
const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";
const PATIENT_API = process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";

interface TelemedicineAppointment {
    id: string;
    patientId: string;
    patientName: string;
    appointmentDateKey: string;
    date: string;
    time: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "STARTED" | "IN_PROGRESS";
    reason?: string;
    symptoms?: string; // Sourced from AI Symptom Checker if booked through there
}

function toLocalDateKey(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export default function TelemedicineDashboard() {
    const { user, isLoading } = useUser();
    const [appointments, setAppointments] = useState<TelemedicineAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [doctorId, setDoctorId] = useState<string | null>(null);

    // Prefer live doctor identity from doctor-service; fallback to token claim.
    useEffect(() => {
        (async () => {
            if (!accessToken) return;
            try {
                const res = await fetch(`${DOCTOR_API}/doctors/me`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    const resolved =
                        (data?.data?._id as string | undefined) ||
                        (data?.data?.id as string | undefined) ||
                        (data?._id as string | undefined) ||
                        (data?.id as string | undefined) ||
                        null;
                    if (resolved) {
                        setDoctorId(resolved);
                        return;
                    }
                }
            } catch {
                // Ignore and use fallback
            }

            const fallback = (user as Record<string, unknown>)?.["https://ezclinic.com/doctorId"] as string | undefined;
            setDoctorId(fallback ?? null);
        })();
    }, [accessToken, user]);

    useEffect(() => {
        fetch("/api/auth/token")
            .then((r) => r.json())
            .then((data) => setAccessToken(data.accessToken ?? null))
            .catch(() => setAccessToken(null));
    }, []);

    const fetchTelemedicineAppointments = useCallback(async () => {
        if (!accessToken || !doctorId) return;
        setLoading(true);
        try {
            const res = await fetch(`${APPOINTMENT_API}/appointments/doctor/${doctorId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!res.ok) throw new Error("Failed to load virtual queue.");
            const data = await res.json();

            const mapped = Array.isArray(data)
                ? data
                      .filter((a: Record<string, unknown>) => {
                          const rawType = ((a.type || a.consultationType) as string | undefined)?.toLowerCase();
                          return rawType === "telemedicine" || rawType === "virtual";
                      })
                      .map((a: Record<string, unknown>) => {
                          const rawDate = (a.appointmentDate || a.date) as string | undefined;
                          const parsedDate = rawDate ? new Date(rawDate) : null;
                          const hasValidDate = Boolean(parsedDate && !Number.isNaN(parsedDate.getTime()));

                          const dateLabel = hasValidDate
                              ? parsedDate!.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                              : rawDate || "—";

                          const timeLabel =
                              ((a.time || a.appointmentTime) as string | undefined) ||
                              (hasValidDate ? parsedDate!.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "");

                          const dateKey = hasValidDate
                              ? toLocalDateKey(parsedDate!)
                              : typeof rawDate === "string" && rawDate.length >= 10
                                ? rawDate.slice(0, 10)
                                : "";

                          return {
                              id: (a.id || a._id) as string,
                              patientId: a.patientId as string,
                              patientName: (a.patientName || "Unknown Patient") as string,
                              appointmentDateKey: dateKey,
                              date: dateLabel,
                              time: timeLabel,
                              status: ((a.status as string) || "PENDING").toUpperCase() as TelemedicineAppointment["status"],
                              reason: (a.reason || a.issues) as string,
                              symptoms: (a.symptoms || undefined) as string | undefined, // Mocking where the symptom context would land
                          };
                      })
                : [];

            // If appointment payloads don't include patientName, resolve from patient service.
            try {
                const idsToResolve = Array.from(
                    new Set(mapped.filter((m) => !m.patientName || m.patientName === "Unknown Patient").map((m) => m.patientId)),
                ).filter(Boolean);

                if (idsToResolve.length > 0) {
                    const responses = await Promise.all(
                        idsToResolve.map((id) =>
                            fetch(`${PATIENT_API}/patients/${id}`, {
                                headers: { Authorization: `Bearer ${accessToken}` },
                            })
                                .then((r) => (r.ok ? r.json().catch(() => null) : null))
                                .catch(() => null),
                        ),
                    );

                    const nameById: Record<string, string> = {};
                    responses.forEach((res, idx) => {
                        const id = idsToResolve[idx];
                        if (!res) return;
                        const raw = (res.data ?? res) as Record<string, unknown>;
                        const resolved =
                            (typeof raw.name === "string" && raw.name) ||
                            (typeof raw.fullName === "string" && raw.fullName) ||
                            (typeof raw.displayName === "string" && raw.displayName) ||
                            (typeof raw.username === "string" && raw.username) ||
                            null;
                        if (resolved) nameById[id] = resolved;
                    });

                    if (Object.keys(nameById).length > 0) {
                        mapped.forEach((m) => {
                            if (nameById[m.patientId]) {
                                m.patientName = nameById[m.patientId];
                            }
                        });
                    }
                }
            } catch {
                // Keep queue visible even if name lookups fail.
            }

            setAppointments(mapped);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [doctorId, accessToken]);

    useEffect(() => {
        if (accessToken && doctorId) fetchTelemedicineAppointments();
    }, [fetchTelemedicineAppointments, accessToken, doctorId]);

    if (isLoading || (loading && !error)) {
        return (
            <div className="flex flex-col justify-center items-center h-[70vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
                <p className="font-medium animate-pulse" style={{ color: "var(--text-secondary)" }}>
                    Initializing Virtual Clinic...
                </p>
            </div>
        );
    }

    if (user && getUserRole(user) !== "doctor") {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Access Denied
                </h1>
                <p className="mt-2" style={{ color: "var(--text-secondary)" }}>
                    Only verified medical professionals can access the Telemedicine Dashboard.
                </p>
                <Link href="/dashboard" className="mt-6 inline-block hover:underline" style={{ color: "var(--brand)" }}>
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const todayKey = toLocalDateKey(new Date());
    const activeStatuses = new Set(["CONFIRMED", "PENDING", "STARTED", "IN_PROGRESS"] as const);

    const activeQueue = appointments.filter((a) => activeStatuses.has(a.status) && a.appointmentDateKey === todayKey);
    const upcomingQueue = appointments.filter((a) => activeStatuses.has(a.status) && a.appointmentDateKey > todayKey);
    const pastSessions = appointments.filter((a) => a.status === "COMPLETED");

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--bg-surface)" }}>
            <div className="mb-8 border-b pb-5" style={{ borderColor: "var(--border)" }}>
                <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
                    <Video className="w-8 h-8" style={{ color: "var(--brand)" }} />
                    Virtual Clinic Dashboard
                </h1>
                <p className="mt-2 text-lg" style={{ color: "var(--text-secondary)" }}>
                    Manage your virtual waiting room and initiate telemedicine sessions.
                </p>
            </div>

            {error && (
                <div
                    className="mb-6 p-4 border rounded-lg flex items-center gap-2"
                    style={{
                        backgroundColor: "var(--danger-surface)",
                        borderColor: "var(--danger-border)",
                        color: "var(--danger-text)",
                    }}
                >
                    <Activity className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Queue Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Clock className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                        Today&apos;s Virtual Queue ({activeQueue.length})
                    </h2>

                    {activeQueue.length === 0 ? (
                        <div
                            className="border text-center p-12 shadow-sm rounded-2xl"
                            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                        >
                            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                                Your virtual waiting room is empty.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeQueue.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="border shadow-sm rounded-2xl p-6 transition-all hover:shadow-md"
                                    style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-5 h-5" style={{ color: "var(--brand)" }} />
                                                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                                                    {apt.patientName}
                                                </h3>
                                                {apt.status === "PENDING" && (
                                                    <span
                                                        className="text-xs font-semibold px-2 py-0.5 rounded border"
                                                        style={{
                                                            backgroundColor: "var(--accent-surface)",
                                                            color: "var(--warning-text)",
                                                            borderColor: "var(--warning-border)",
                                                        }}
                                                    >
                                                        AWAITING CONFIRMATION
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> {apt.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> {apt.time}
                                                </span>
                                            </div>

                                            {apt.reason && (
                                                <div
                                                    className="rounded-lg p-3 text-sm border"
                                                    style={{
                                                        backgroundColor: "var(--bg-muted)",
                                                        borderColor: "var(--border)",
                                                        color: "var(--text-secondary)",
                                                    }}
                                                >
                                                    <span className="font-semibold block mb-1" style={{ color: "var(--text-primary)" }}>
                                                        Patient Reason:
                                                    </span>
                                                    {apt.reason}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-end shrink-0">
                                            {apt.status === "CONFIRMED" ? (
                                                <Link
                                                    href={`/telemedicine/${apt.id}`}
                                                    className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm transition-colors"
                                                    style={{ backgroundColor: "var(--brand)", color: "#ffffff" }}
                                                >
                                                    <Video className="w-4 h-4" />
                                                    Start Session
                                                </Link>
                                            ) : (
                                                <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                                                    Confirm appointment to start session.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                        <Calendar className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                        Upcoming Virtual Queue ({upcomingQueue.length})
                    </h2>

                    {upcomingQueue.length === 0 ? (
                        <div
                            className="border text-center p-6 shadow-sm rounded-2xl"
                            style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                        >
                            <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                                No upcoming virtual appointments.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcomingQueue.map((apt) => (
                                <div
                                    key={apt.id}
                                    className="border shadow-sm rounded-2xl p-6"
                                    style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-5 h-5" style={{ color: "var(--brand)" }} />
                                                <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                                                    {apt.patientName}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" /> {apt.date}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-4 h-4" /> {apt.time}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-end shrink-0">
                                            <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                                                Starts on scheduled date.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="border rounded-2xl p-6" style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                            Quick Stats
                        </h3>
                        <ul className="space-y-4">
                            <li
                                className="flex justify-between items-center p-3 rounded-lg border shadow-sm"
                                style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                            >
                                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                    Waiting
                                </span>
                                <span className="text-xl font-bold" style={{ color: "var(--brand)" }}>
                                    {activeQueue.length}
                                </span>
                            </li>
                            <li
                                className="flex justify-between items-center p-3 rounded-lg border shadow-sm"
                                style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                            >
                                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                                    Completed
                                </span>
                                <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                                    {pastSessions.length}
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                            <CheckCircle className="w-5 h-5" style={{ color: "var(--brand)" }} />
                            Completed Sessions
                        </h2>
                        {pastSessions.length === 0 ? (
                            <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                                No completed sessions today.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {pastSessions.slice(0, 5).map((session) => (
                                    <li
                                        key={session.id}
                                        className="border rounded-lg p-3 text-sm flex justify-between shadow-sm"
                                        style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
                                    >
                                        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                                            {session.patientName}
                                        </span>
                                        <span style={{ color: "var(--text-secondary)" }}>{session.time}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
