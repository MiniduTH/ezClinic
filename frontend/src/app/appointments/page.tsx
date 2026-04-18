"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";
import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";

const APPOINTMENT_API = process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004/api/v1";
const PATIENT_API = process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";
const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
    id: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName?: string;
    date: string;
    time: string;
    type: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    reason?: string;
    paymentStatus?: string;
    amountPaid?: number;
}

interface Doctor {
    _id?: string;
    id: string;
    name: string;
    specialty?: string;
    specialization?: string;
    consultationFee: number;
    consultationType?: string;
    availability?: Array<{ isActive?: boolean }>;
    isVerified?: boolean;
}

interface PatientProfile {
    id?: string;
    _id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    avatarUrl?: string;
    bloodType?: string;
    allergies?: string | string[];
    emergencyContact?: { name?: string; phone?: string; relationship?: string };
    status?: string;
}

interface AvailabilitySlot {
    _id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    consultationType: string;
    maxPatients: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
    const styleMap: Record<string, React.CSSProperties> = {
        PENDING: {
            backgroundColor: "var(--accent-surface)",
            color: "var(--warning-text)",
            borderColor: "var(--accent)",
            border: "1px solid",
        },
        CONFIRMED: {
            backgroundColor: "var(--brand-surface)",
            color: "var(--brand-text)",
            borderColor: "var(--brand-border)",
            border: "1px solid",
        },
        COMPLETED: {
            backgroundColor: "var(--bg-muted)",
            color: "var(--text-secondary)",
        },
        CANCELLED: {
            backgroundColor: "var(--danger-surface)",
            color: "var(--danger-text)",
            borderColor: "var(--danger-border)",
            border: "1px solid",
        },
        RESCHEDULED: {
            backgroundColor: "#f5f3ff",
            color: "#7c3aed",
            borderColor: "#ddd6fe",
            border: "1px solid",
        },
    };

    const style: React.CSSProperties = styleMap[status] ?? {
        backgroundColor: "var(--bg-muted)",
        color: "var(--text-secondary)",
    };

    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={style}>
            {status}
        </span>
    );
}

// ─── Doctor View ──────────────────────────────────────────────────────────────

function DoctorAppointments({ accessToken }: { accessToken: string }) {
    const { user } = useUser();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState<string>("ALL");

    // Resolve doctorId by calling doctor-service /doctors/me (more reliable than JWT claims)
    const [doctorId, setDoctorId] = useState<string | null>(null);

    const [viewPatient, setViewPatient] = useState<PatientProfile | null>(null);
    const [patientLoading, setPatientLoading] = useState(false);

    const fetchPatientProfile = async (patientId: string) => {
        setPatientLoading(true);
        setViewPatient(null);
        try {
            const res = await fetch(`${PATIENT_API}/patients/${patientId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error("Could not load patient profile");
            const data = await res.json();
            setViewPatient(data?.data ?? data);
        } catch {
            setViewPatient({});
        } finally {
            setPatientLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            if (!accessToken) return;
            try {
                const res = await fetch(`${DOCTOR_API}/doctors/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
                if (!res.ok) return;
                const data = await res.json();
                const id = data?.data?._id ?? data?.data?.id ?? data?._id ?? data?.id;
                if (id) setDoctorId(id);
            } catch {
                // ignore - fallback handled below
            }
        })();
    }, [accessToken]);

    const fetchAppointments = useCallback(async () => {
        if (!doctorId) return;
        setLoading(true);
        try {
            const res = await fetch(`${APPOINTMENT_API}/appointments/doctor/${doctorId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
            if (!res.ok) throw new Error("Failed to load appointments");
            const data = await res.json();
            const mapped = Array.isArray(data)
                ? data.map((a: Record<string, unknown>) => {
                      const rawDate = (a.appointmentDate || a.date) as string | undefined;
                      const dateObj = rawDate ? new Date(rawDate) : null;
                      const formattedDate = dateObj
                          ? dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                          : (rawDate as string) || "—";
                      const formattedTime = dateObj
                          ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                          : ((a.time || a.appointmentTime) as string) || "";
                      const rawType = ((a.type || a.consultationType || "VIRTUAL") as string).toUpperCase();
                      return {
                          id: (a.id || a._id) as string,
                          patientId: a.patientId as string,
                          patientName: (a.patientName || "Unknown Patient") as string,
                          doctorId: a.doctorId as string,
                          date: formattedDate,
                          time: formattedTime,
                          type: rawType,
                          status: ((a.status as string) || "PENDING").toUpperCase() as Appointment["status"],
                          reason: (a.reason || a.issues) as string | undefined,
                          paymentStatus: (a.paymentStatus as string) || undefined,
                          amountPaid: (a.amountPaid as number) || undefined,
                      };
                  })
                : [];
            setAppointments(mapped);

            // If any appointments lack a patientName, try to resolve names from patient-admin service
            try {
                const idsToResolve = Array.from(
                    new Set(mapped.filter((m) => !m.patientName || m.patientName === "Unknown Patient").map((m) => m.patientId)),
                ).filter(Boolean);
                if (idsToResolve.length > 0 && accessToken) {
                    const responses = await Promise.all(
                        idsToResolve.map((id) =>
                            fetch(`${PATIENT_API}/patients/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } })
                                .then((r) => (r.ok ? r.json().catch(() => null) : null))
                                .catch(() => null),
                        ),
                    );
                    const nameById: Record<string, string> = {};
                    responses.forEach((res, idx) => {
                        const id = idsToResolve[idx];
                        if (!res) return;
                        const raw = (res.data ?? res) as any;
                        const resolved = (raw.name ||
                            raw.fullName ||
                            (raw.firstName && raw.lastName && `${raw.firstName} ${raw.lastName}`) ||
                            raw.displayName ||
                            raw.username) as string | undefined;
                        if (resolved) nameById[id] = resolved;
                    });
                    if (Object.keys(nameById).length > 0) {
                        setAppointments((prev) => prev.map((p) => ({ ...p, patientName: nameById[p.patientId] ?? p.patientName })));
                    }
                }
            } catch {
                // gracefully ignore lookup failures
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [doctorId, accessToken]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleAction = async (id: string, action: "confirm" | "cancel") => {
        try {
            if (action === "cancel") {
                await fetch(`${APPOINTMENT_API}/appointments/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
            } else {
                await fetch(`${APPOINTMENT_API}/appointments/${id}/status`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "CONFIRMED" }),
                });
            }
            await fetchAppointments();
        } catch {
            setAppointments((prev) =>
                prev.map((a) =>
                    a.id === id
                        ? {
                              ...a,
                              status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
                          }
                        : a,
                ),
            );
        }
    };

    const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-4 space-y-6" style={{ backgroundColor: "var(--bg-surface)" }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
                        My Appointments
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                        Manage your upcoming patient appointments
                    </p>
                </div>
                <Link href="/dashboard" className="text-sm font-medium shrink-0 transition-colors" style={{ color: "var(--brand)" }}>
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                        style={
                            filter === s
                                ? { backgroundColor: "var(--brand)", color: "#ffffff" }
                                : { backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }
                        }
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: "var(--brand)" }} />
                </div>
            ) : error ? (
                <div
                    className="p-5 rounded-xl text-sm border"
                    style={{
                        backgroundColor: "var(--danger-surface)",
                        borderColor: "var(--danger-border)",
                        color: "var(--danger-text)",
                    }}
                >
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <div
                    className="p-12 text-center rounded-2xl border"
                    style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                    }}
                >
                    <svg className="mx-auto mb-4 h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                        />
                    </svg>
                    <p className="text-sm font-medium">No appointments found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((apt) => {
                        const initials = (apt.patientName || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                        return (
                            <div
                                key={apt.id}
                                className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                                style={{
                                    backgroundColor: "var(--bg-elevated)",
                                    borderColor: "var(--border)",
                                }}
                            >
                                {/* Left: avatar + info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Avatar — clickable for confirmed appointments */}
                                    <div
                                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${apt.status === "CONFIRMED" ? "cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all" : ""}`}
                                        style={{
                                            backgroundColor: "var(--brand-surface)",
                                            color: "var(--brand-text)",
                                            ...(apt.status === "CONFIRMED" ? { ringColor: "var(--brand)" } : {}),
                                        }}
                                        onClick={() => apt.status === "CONFIRMED" && fetchPatientProfile(apt.patientId)}
                                        title={apt.status === "CONFIRMED" ? "View patient profile" : undefined}
                                    >
                                        {initials}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                {apt.patientName}
                                            </span>
                                            {statusBadge(apt.status)}
                                        </div>
                                        <div className="text-sm flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "var(--text-muted)" }}>
                                            <span>📅 {apt.date}</span>
                                            <span>🕐 {apt.time}</span>
                                            <span>📍 {apt.type}</span>
                                        </div>
                                        {apt.reason && (
                                            <p className="mt-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                                                Reason: {apt.reason}
                                            </p>
                                        )}
                                        {apt.type.toLowerCase() === "telemedicine" && apt.status === "COMPLETED" && (
                                            <div className="mt-4">
                                                <NotificationBanner appointmentId={apt.id} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: actions */}
                                {apt.status === "PENDING" && (
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAction(apt.id, "confirm")}
                                            className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--brand)",
                                                color: "#ffffff",
                                            }}
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => handleAction(apt.id, "cancel")}
                                            className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--danger-surface)",
                                                color: "var(--danger-text)",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                {apt.status === "CONFIRMED" && (
                                    <Link
                                        href={`/telemedicine/${apt.id}`}
                                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                                        style={{
                                            backgroundColor: "var(--brand)",
                                            color: "#ffffff",
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                                            />
                                        </svg>
                                        Start Session
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Patient Profile Modal */}
            {(patientLoading || viewPatient !== null) && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                    onClick={() => setViewPatient(null)}
                >
                    <div
                        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
                        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div
                            className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
                        >
                            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
                                Patient Profile
                            </h2>
                            <button
                                onClick={() => setViewPatient(null)}
                                className="p-1 rounded-lg transition-colors"
                                style={{ color: "var(--text-muted)" }}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6">
                            {patientLoading ? (
                                <div className="flex justify-center items-center h-32">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--brand)" }} />
                                </div>
                            ) : !viewPatient || Object.keys(viewPatient).length === 0 ? (
                                <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>Could not load patient profile.</p>
                            ) : (() => {
                                const p = viewPatient;
                                const displayName = p.name || p.fullName || "Unknown Patient";
                                const initials2 = displayName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                                const allergiesList = Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies;
                                const dob = p.dob ? new Date(p.dob).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;
                                return (
                                    <div className="space-y-5">
                                        {/* Avatar + name */}
                                        <div className="flex items-center gap-4">
                                            {p.avatarUrl ? (
                                                <img src={p.avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold" style={{ backgroundColor: "var(--brand-surface)", color: "var(--brand-text)" }}>
                                                    {initials2}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{displayName}</p>
                                                {p.status && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--brand-surface)", color: "var(--brand-text)" }}>{p.status}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                            {[
                                                { label: "Email", value: p.email },
                                                { label: "Phone", value: p.phone },
                                                { label: "Date of Birth", value: dob },
                                                { label: "Gender", value: p.gender },
                                                { label: "Blood Type", value: p.bloodType },
                                                { label: "Address", value: p.address },
                                            ].filter(f => f.value).map(({ label, value }) => (
                                                <div key={label}>
                                                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
                                                    <p style={{ color: "var(--text-primary)" }}>{value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Allergies */}
                                        {allergiesList && (
                                            <div className="text-sm">
                                                <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Allergies</p>
                                                <p className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-primary)" }}>{allergiesList}</p>
                                            </div>
                                        )}

                                        {/* Emergency contact */}
                                        {p.emergencyContact && (p.emergencyContact.name || p.emergencyContact.phone) && (
                                            <div className="text-sm rounded-xl p-3" style={{ backgroundColor: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                                                <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Emergency Contact</p>
                                                <div className="flex flex-wrap gap-x-5 gap-y-1">
                                                    {p.emergencyContact.name && <span style={{ color: "var(--text-primary)" }}>{p.emergencyContact.name}</span>}
                                                    {p.emergencyContact.relationship && <span style={{ color: "var(--text-secondary)" }}>({p.emergencyContact.relationship})</span>}
                                                    {p.emergencyContact.phone && <span style={{ color: "var(--text-secondary)" }}>📞 {p.emergencyContact.phone}</span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Pay Now Button ───────────────────────────────────────────────────────────

function PayNowButton({ appointmentId, accessToken }: { appointmentId: string; accessToken: string }) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${APPOINTMENT_API.replace("/api/v1", "")}/api/payments/checkout-params/${appointmentId}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (!res.ok) throw new Error("Could not fetch payment details");
            const params: Record<string, string> = await res.json();

            // Build a hidden form and submit to PayHere sandbox
            const form = document.createElement("form");
            form.method = "POST";
            form.action = "https://sandbox.payhere.lk/pay/checkout";
            form.target = "_blank";
            Object.entries(params).forEach(([key, val]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = String(val);
                form.appendChild(input);
            });
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        } catch {
            alert("Payment unavailable. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePay}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
        >
            {loading ? "Loading…" : "💳 Pay Now"}
        </button>
    );
}

// ─── Patient View ─────────────────────────────────────────────────────────────

function PatientAppointments({ accessToken }: { accessToken: string }) {
    const { user } = useUser();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [patientId, setPatientId] = useState<string | null>(null);
    const [showBooking, setShowBooking] = useState(false);
    const [filter, setFilter] = useState("ALL");

    // Booking form state
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [bookDate, setBookDate] = useState("");
    const [bookTime, setBookTime] = useState("");
    const [bookReason, setBookReason] = useState("");
    const [bookType, setBookType] = useState("telemedicine");
    const [booking, setBooking] = useState(false);
    const [bookError, setBookError] = useState("");
    const [specialtyFilter, setSpecialtyFilter] = useState("");

    // Availability slot state – populated when a doctor is selected
    const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
    const [upcomingDates, setUpcomingDates] = useState<string[]>([]);

    /** Returns the next `count` calendar dates that fall on the given day-of-week */
    const getUpcomingDatesForDay = (dayOfWeek: string, count = 8): string[] => {
        const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(dayOfWeek);
        const results: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let offset = 0; results.length < count; offset++) {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            if (d.getDay() === dayIndex) results.push(d.toISOString().split("T")[0]);
        }
        return results;
    };

    // Fetch availability when a doctor is chosen
    useEffect(() => {
        setSelectedSlot(null);
        setUpcomingDates([]);
        setBookDate("");
        setBookTime("");
        if (!selectedDoctor) {
            setAvailabilitySlots([]);
            return;
        }
        (async () => {
            setSlotsLoading(true);
            try {
                const res = await fetch(`${DOCTOR_API}/doctors/${selectedDoctor}/availability`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                const raw: AvailabilitySlot[] = (data.data?.slots || data.slots || []).map((s: any) => ({
                    _id: s._id || s.id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    isActive: !!s.isActive,
                    consultationType: s.consultationType || "both",
                    maxPatients: s.maxPatients ?? 1,
                }));
                setAvailabilitySlots(raw.filter((s) => s.isActive));
            } catch {
                setAvailabilitySlots([]);
            } finally {
                setSlotsLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDoctor, accessToken]);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };

            // Resolve patient identity
            let meRes = await fetch(`${PATIENT_API}/patients/me`, { headers });

            // Some accounts can authenticate before a patient profile row exists.
            // Bootstrap the profile once, then re-fetch /patients/me.
            if (meRes.status === 404) {
                const email = typeof user?.email === "string" ? user.email.trim() : "";
                const rawName = typeof user?.name === "string" ? user.name.trim() : "";
                const name = rawName || (email ? email.split("@")[0] : "Patient");

                if (!email) {
                    throw new Error("Could not load patient profile");
                }

                const registerRes = await fetch(`${PATIENT_API}/patients/register`, {
                    method: "POST",
                    headers: {
                        ...headers,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name, email }),
                });

                if (!registerRes.ok && registerRes.status !== 409) {
                    throw new Error("Could not load patient profile");
                }

                meRes = await fetch(`${PATIENT_API}/patients/me`, { headers });
            }

            if (!meRes.ok) {
                if (meRes.status === 403) {
                    throw new Error("This page is only available to patient accounts");
                }
                throw new Error("Could not load patient profile");
            }

            const me = await meRes.json();
            const patientIdentity = me?.data ?? me;
            const resolvedPatientId = typeof patientIdentity?.id === "string" ? patientIdentity.id : null;

            if (!resolvedPatientId) {
                throw new Error("Could not load patient profile");
            }

            setPatientId(resolvedPatientId);

            // Fetch appointments
            const aptsRes = await fetch(`${APPOINTMENT_API}/appointments/patient/${resolvedPatientId}`, { headers });
            if (aptsRes.ok) {
                const data = await aptsRes.json();
                const mapped = Array.isArray(data)
                    ? data.map((a: Record<string, unknown>) => {
                          const rawDate = (a.appointmentDate || a.date) as string | undefined;
                          const dateObj = rawDate ? new Date(rawDate) : null;
                          const formattedDate = dateObj
                              ? dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                              : "—";
                          const formattedTime = dateObj
                              ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                              : "";
                          const rawType = ((a.type || a.consultationType || "VIRTUAL") as string).toUpperCase();
                          return {
                              id: (a.id || a._id) as string,
                              patientId: a.patientId as string,
                              doctorId: a.doctorId as string,
                              doctorName: (a.doctorName || "") as string,
                              date: formattedDate,
                              time: formattedTime,
                              type: rawType,
                              status: ((a.status as string) || "PENDING").toUpperCase() as Appointment["status"],
                              reason: a.reason as string | undefined,
                              paymentStatus: (a.paymentStatus as string) || undefined,
                              amountPaid: a.amountPaid as number | undefined,
                          };
                      })
                    : [];
                setAppointments(mapped);
            }

            // Fetch doctors for booking
            const docsRes = await fetch(`${DOCTOR_API}/doctors`, { headers });
            if (docsRes.ok) {
                const docsData = await docsRes.json();
                const rawDoctors = Array.isArray(docsData) ? docsData : docsData.data || [];
                const normalizedDoctors: Doctor[] = rawDoctors
                    .map((d: Record<string, unknown>) => ({
                        _id: (d._id as string) || undefined,
                        id: ((d.id as string) || (d._id as string) || "") as string,
                        name: (d.name as string) || "Unknown Doctor",
                        specialty: (d.specialty as string) || (d.specialization as string) || "General",
                        specialization: (d.specialization as string) || (d.specialty as string) || "General",
                        consultationFee: Number(d.consultationFee ?? 0),
                        consultationType: (d.consultationType as string) || undefined,
                        availability: Array.isArray(d.availability) ? (d.availability as Array<{ isActive?: boolean }>) : [],
                        isVerified: !!(d as any).isVerified,
                    }))
                    .filter((d: Doctor) => Boolean(d.id));
                setDoctors(normalizedDoctors);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [accessToken, user]);

    // Resolve doctor names after both appointments and doctors are loaded
    useEffect(() => {
        if (doctors.length === 0) return;
        setAppointments((prev) =>
            prev.map((apt) => {
                if (apt.doctorName) return apt;
                const doc = doctors.find((d) => d.id === apt.doctorId || d._id === apt.doctorId);
                return doc ? { ...apt, doctorName: doc.name } : { ...apt, doctorName: "Dr. (ID: " + apt.doctorId.slice(0, 8) + "…)" };
            }),
        );
    }, [doctors]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId || !selectedDoctor || !bookDate || !selectedSlot) {
            setBookError("Please select a doctor, a time slot, and a date.");
            return;
        }
        setBooking(true);
        setBookError("");
        try {
            const res = await fetch(`${APPOINTMENT_API}/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    patientId,
                    doctorId: selectedDoctor,
                    slotId: selectedSlot._id,
                    appointmentDate: bookDate,
                    type: bookType === "telemedicine" ? "VIRTUAL" : "PHYSICAL",
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Booking failed");
            }
            setShowBooking(false);
            setSelectedDoctor("");
            setBookDate("");
            setBookTime("");
            setBookReason("");
            setSelectedSlot(null);
            setAvailabilitySlots([]);
            setUpcomingDates([]);
            await fetchAll();
        } catch (err) {
            setBookError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setBooking(false);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Cancel this appointment?")) return;
        try {
            await fetch(`${APPOINTMENT_API}/appointments/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            await fetchAll();
        } catch {
            setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a)));
        }
    };

    const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

    // Only show verified doctors to patients for booking
    const availableDoctors = doctors
        .filter((d) => d.isVerified !== false) // treat undefined as allowed, but explicitly hide false
        .filter((d) => !d.availability || d.availability.length === 0 || d.availability.some((slot) => slot.isActive));

    const specialties = Array.from(new Set(availableDoctors.map((d) => d.specialization || d.specialty).filter(Boolean)));

    const filteredDoctors = specialtyFilter
        ? availableDoctors.filter((d) => (d.specialization || d.specialty) === specialtyFilter)
        : availableDoctors;

    const inputStyle: React.CSSProperties = {
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "0.875rem",
        backgroundColor: "var(--bg-elevated)",
        color: "var(--text-primary)",
        outline: "none",
    };

    return (
        <div className="max-w-[1200px] mx-auto py-8 px-4 space-y-6" style={{ backgroundColor: "var(--bg-surface)" }}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
                        My Appointments
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                        View and manage your consultations
                    </p>
                </div>
                <button
                    onClick={() => setShowBooking(true)}
                    className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: "var(--brand)", color: "#ffffff" }}
                >
                    + Book Appointment
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                        style={
                            filter === s
                                ? { backgroundColor: "var(--brand)", color: "#ffffff" }
                                : { backgroundColor: "var(--bg-muted)", color: "var(--text-secondary)" }
                        }
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Book Appointment Modal */}
            {showBooking && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
                >
                    <div
                        className="w-full max-w-lg rounded-xl border p-6 space-y-4"
                        style={{
                            backgroundColor: "var(--bg-elevated)",
                            borderColor: "var(--border)",
                        }}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                                Book a Consultation
                            </h2>
                            <button
                                onClick={() => {
                                    setShowBooking(false);
                                    setBookError("");
                                    setSelectedDoctor("");
                                    setSelectedSlot(null);
                                    setAvailabilitySlots([]);
                                    setUpcomingDates([]);
                                    setBookDate("");
                                }}
                                className="text-2xl leading-none transition-colors"
                                style={{ color: "var(--text-muted)" }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleBook} className="space-y-4">
                            {/* Specialty filter */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                                    Filter by Specialty
                                </label>
                                <select
                                    value={specialtyFilter}
                                    onChange={(e) => {
                                        setSpecialtyFilter(e.target.value);
                                        setSelectedDoctor("");
                                    }}
                                    style={inputStyle}
                                >
                                    <option value="">All Specialties</option>
                                    {specialties.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Doctor select */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                                    Select Doctor <span style={{ color: "var(--danger)" }}>*</span>
                                </label>
                                {filteredDoctors.length === 0 ? (
                                    <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                                        No doctors available.
                                    </p>
                                ) : (
                                    <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)} required style={inputStyle}>
                                        <option value="">Choose a doctor…</option>
                                        {filteredDoctors.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name} — {d.specialization || d.specialty || "General"}
                                                {d.consultationFee
                                                    ? ` (LKR ${Number(d.consultationFee).toFixed(2)} → LKR ${Number(d.consultationFee * 1.25).toFixed(2)})`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Display fee with 25% markup when a doctor is chosen */}
                            {selectedDoctor &&
                                (() => {
                                    const doc = doctors.find((dd) => dd.id === selectedDoctor || dd._id === selectedDoctor);
                                    const base = doc?.consultationFee ?? 0;
                                    const total = Number((base * 1.25).toFixed(2));
                                    return (
                                        <div className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                                            <strong>Fee:</strong> LKR {base ? base.toLocaleString() : "0.00"} &nbsp;→&nbsp;{" "}
                                            <strong>LKR {total.toLocaleString()}</strong> (including 25% service)
                                        </div>
                                    );
                                })()}

                            {/* Availability Slots */}
                            {selectedDoctor && (
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                                        Available Time Slots <span style={{ color: "var(--danger)" }}>*</span>
                                    </label>
                                    {slotsLoading ? (
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                                            Loading slots…
                                        </p>
                                    ) : availabilitySlots.length === 0 ? (
                                        <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                                            No active slots for this doctor.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            {availabilitySlots.map((slot) => {
                                                const isSelected = selectedSlot?._id === slot._id;
                                                const typeLabel =
                                                    slot.consultationType === "both"
                                                        ? "In-Person & Virtual"
                                                        : slot.consultationType === "in-person"
                                                          ? "In-Person"
                                                          : "Virtual";
                                                return (
                                                    <button
                                                        key={slot._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSlot(slot);
                                                            setBookDate("");
                                                            setUpcomingDates(getUpcomingDatesForDay(slot.dayOfWeek));
                                                            // Auto-set consultation type if not "both"
                                                            if (slot.consultationType !== "both") {
                                                                setBookType(slot.consultationType);
                                                            }
                                                        }}
                                                        className="text-left rounded-lg border p-3 transition-all text-sm"
                                                        style={{
                                                            borderColor: isSelected ? "var(--brand)" : "var(--border)",
                                                            backgroundColor: isSelected ? "var(--brand-surface)" : "var(--bg-elevated)",
                                                            color: "var(--text-primary)",
                                                            outline: isSelected ? "2px solid var(--brand)" : "none",
                                                        }}
                                                    >
                                                        <div className="font-semibold">{slot.dayOfWeek}</div>
                                                        <div style={{ color: "var(--text-secondary)" }}>
                                                            {slot.startTime} – {slot.endTime}
                                                        </div>
                                                        <div className="mt-1">
                                                            <span
                                                                className="text-xs px-1.5 py-0.5 rounded-full"
                                                                style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}
                                                            >
                                                                {typeLabel}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Date picker – shown after a slot is selected */}
                            {selectedSlot && upcomingDates.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                                        Pick a Date ({selectedSlot.dayOfWeek}s) <span style={{ color: "var(--danger)" }}>*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {upcomingDates.map((d) => {
                                            const label = new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                            const isChosen = bookDate === d;
                                            return (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => {
                                                        setBookDate(d);
                                                        setBookTime(selectedSlot.startTime);
                                                    }}
                                                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                                                    style={{
                                                        backgroundColor: isChosen ? "var(--brand)" : "var(--bg-muted)",
                                                        color: isChosen ? "#ffffff" : "var(--text-secondary)",
                                                    }}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Consultation type */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                                    Consultation Type
                                </label>
                                <select
                                    value={bookType}
                                    onChange={(e) => setBookType(e.target.value)}
                                    disabled={!!selectedSlot && selectedSlot.consultationType !== "both"}
                                    style={{ ...inputStyle, opacity: selectedSlot && selectedSlot.consultationType !== "both" ? 0.7 : 1 }}
                                >
                                    {(!selectedSlot ||
                                        selectedSlot.consultationType === "both" ||
                                        selectedSlot.consultationType === "telemedicine") && (
                                        <option value="telemedicine">Virtual (Video Call)</option>
                                    )}
                                    {(!selectedSlot || selectedSlot.consultationType === "both" || selectedSlot.consultationType === "in-person") && (
                                        <option value="in-person">In-Person (Clinic Visit)</option>
                                    )}
                                </select>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                                    Reason / Symptoms
                                </label>
                                <textarea
                                    value={bookReason}
                                    onChange={(e) => setBookReason(e.target.value)}
                                    rows={3}
                                    placeholder="Briefly describe your symptoms or reason for visit…"
                                    style={{ ...inputStyle, resize: "none" }}
                                />
                            </div>

                            {/* Error */}
                            {bookError && (
                                <p
                                    className="text-sm rounded-lg px-3 py-2 border"
                                    style={{
                                        backgroundColor: "var(--danger-surface)",
                                        borderColor: "var(--danger-border)",
                                        color: "var(--danger-text)",
                                    }}
                                >
                                    {bookError}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBooking(false);
                                        setBookError("");
                                        setSelectedDoctor("");
                                        setSelectedSlot(null);
                                        setAvailabilitySlots([]);
                                        setUpcomingDates([]);
                                        setBookDate("");
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: "var(--bg-muted)",
                                        color: "var(--text-secondary)",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={booking}
                                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    style={{
                                        backgroundColor: "var(--brand)",
                                        color: "#ffffff",
                                    }}
                                >
                                    {booking ? "Booking…" : "Confirm Booking"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointments list */}
            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: "var(--brand)" }} />
                </div>
            ) : error ? (
                <div
                    className="p-5 rounded-xl text-sm border"
                    style={{
                        backgroundColor: "var(--danger-surface)",
                        borderColor: "var(--danger-border)",
                        color: "var(--danger-text)",
                    }}
                >
                    {error}
                </div>
            ) : filtered.length === 0 ? (
                <div
                    className="p-12 text-center rounded-2xl border"
                    style={{
                        backgroundColor: "var(--bg-elevated)",
                        borderColor: "var(--border)",
                    }}
                >
                    <svg
                        className="mx-auto mb-4 h-12 w-12 opacity-40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        style={{ color: "var(--text-muted)" }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5"
                        />
                    </svg>
                    <p className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>
                        No appointments yet
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                        Click{" "}
                        <button onClick={() => setShowBooking(true)} className="underline" style={{ color: "var(--brand)" }}>
                            Book Appointment
                        </button>{" "}
                        to get started.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((apt) => {
                        const initials = (apt.doctorName || "?")
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();

                        const aptDoctor = doctors.find(
                            (d) => d.id === apt.doctorId || d._id === apt.doctorId
                        );
                        const consultationFee = aptDoctor?.consultationFee;

                        return (
                            <div
                                key={apt.id}
                                className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                                style={{
                                    backgroundColor: "var(--bg-elevated)",
                                    borderColor: "var(--border)",
                                }}
                            >
                                {/* Left: avatar + info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {/* Avatar */}
                                    <div
                                        className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                                        style={{
                                            backgroundColor: "var(--brand-surface)",
                                            color: "var(--brand-text)",
                                        }}
                                    >
                                        {initials}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                                                {apt.doctorName}
                                            </span>
                                            {statusBadge(apt.status)}
                                        </div>
                                        <div className="text-sm flex flex-wrap gap-x-3 gap-y-0.5" style={{ color: "var(--text-muted)" }}>
                                            <span>📅 {apt.date}</span>
                                            {apt.time && <span>🕐 {apt.time}</span>}
                                            <span>{apt.type === "VIRTUAL" ? "📹 Virtual" : "🏥 In-Person"}</span>
                                            {apt.amountPaid && <span>💳 LKR {apt.amountPaid.toLocaleString()}</span>}
                                        </div>
                                        {apt.reason && (
                                            <p className="mt-1 text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                                                {apt.reason}
                                            </p>
                                        )}
                                        {apt.type === "VIRTUAL" && apt.status === "COMPLETED" && (
                                            <div className="mt-4">
                                                <NotificationBanner appointmentId={apt.id} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: actions */}
                                <div className="flex gap-2 shrink-0 items-center flex-wrap justify-end">
                                    {/* Pay Now — shown when payment is still pending */}
                                    {apt.paymentStatus === "PENDING" && apt.status !== "CANCELLED" && (
                                        <PayNowButton appointmentId={apt.id} accessToken={accessToken} />
                                    )}
                                    {apt.status === "CONFIRMED" && apt.type === "VIRTUAL" && (
                                        <Link
                                            href={`/telemedicine/${apt.id}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--brand)",
                                                color: "#ffffff",
                                            }}
                                        >
                                            📹 Join Virtual Meeting
                                        </Link>
                                    )}
                                    {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                                        <button
                                            onClick={() => handleCancel(apt.id)}
                                            className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors"
                                            style={{
                                                backgroundColor: "var(--danger-surface)",
                                                color: "var(--danger-text)",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
    const { user, isLoading } = useUser();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/token")
            .then((r) => r.json())
            .then((data) => setAccessToken(data.accessToken ?? null))
            .catch(() => setAccessToken(null))
            .finally(() => setTokenLoading(false));
    }, []);

    if (isLoading || tokenLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: "var(--brand)" }} />
            </div>
        );
    }

    if (!user || !accessToken) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]" style={{ color: "var(--text-secondary)" }}>
                <p>
                    Please{" "}
                    <a href="/login" className="underline" style={{ color: "var(--brand)" }}>
                        log in
                    </a>{" "}
                    to view appointments.
                </p>
            </div>
        );
    }

    const role = getUserRole(user);

    if (role === "doctor") {
        return <DoctorAppointments accessToken={accessToken} />;
    }

    return <PatientAppointments accessToken={accessToken} />;
}
