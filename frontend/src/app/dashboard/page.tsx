"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/session-context";
import FilePreviewModal from "@/components/FilePreviewModal";

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styleMap: Record<string, { bg: string; color: string }> = {
    PENDING: {
      bg: "var(--accent-surface)",
      color: "var(--accent)",
    },
    CONFIRMED: {
      bg: "var(--brand-surface)",
      color: "var(--brand-text)",
    },
    COMPLETED: {
      bg: "var(--bg-muted)",
      color: "var(--text-secondary)",
    },
    CANCELLED: {
      bg: "var(--danger-surface)",
      color: "var(--danger-text)",
    },
    RESCHEDULED: {
      bg: "#f3e8ff",
      color: "#7c3aed",
    },
  };

  const s = styleMap[status] ?? {
    bg: "var(--bg-muted)",
    color: "var(--text-secondary)",
  };

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: "999px",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-xl border p-5"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div
            className="h-3 w-24 rounded"
            style={{ background: "var(--bg-muted)" }}
          />
          <div
            className="h-8 w-12 rounded"
            style={{ background: "var(--bg-muted)" }}
          />
        </div>
        <div
          className="w-10 h-10 rounded-lg"
          style={{ background: "var(--bg-muted)" }}
        />
      </div>
    </div>
  );
}

function SkeletonAppointmentRow() {
  return (
    <div
      className="animate-pulse rounded-xl border p-5 flex items-center gap-4"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div
        className="w-10 h-10 rounded-full flex-shrink-0"
        style={{ background: "var(--bg-muted)" }}
      />
      <div className="flex-1 space-y-2">
        <div
          className="h-4 w-40 rounded"
          style={{ background: "var(--bg-muted)" }}
        />
        <div
          className="h-3 w-56 rounded"
          style={{ background: "var(--bg-muted)" }}
        />
      </div>
      <div className="flex gap-2">
        <div
          className="h-8 w-20 rounded-lg"
          style={{ background: "var(--bg-muted)" }}
        />
        <div
          className="h-8 w-24 rounded-lg"
          style={{ background: "var(--bg-muted)" }}
        />
      </div>
    </div>
  );
}

// ─── Patient Reports Modal ────────────────────────────────────────────────────

type ReportType = "lab" | "imaging" | "prescription" | "other";

interface Report {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  reportType: ReportType;
  description: string | null;
  reportDate: string | null;
  uploadedAt: string;
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  lab: "Lab Result",
  imaging: "Imaging",
  prescription: "Prescription",
  other: "Other",
};

const TYPE_BADGE_STYLE: Record<ReportType, { bg: string; color: string }> = {
  lab: { bg: "#dbeafe", color: "#1d4ed8" },
  imaging: { bg: "#ede9fe", color: "#6d28d9" },
  prescription: { bg: "#dcfce7", color: "#15803d" },
  other: { bg: "var(--bg-muted)", color: "var(--text-secondary)" },
};

function PatientReportsModal({
  patientId,
  patientName,
  onClose,
}: {
  patientId: string;
  patientName: string;
  onClose: () => void;
}) {
  const PATIENT_API =
    process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Report | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Not authenticated");
        const { accessToken } = await tokenRes.json();

        const res = await fetch(`${PATIENT_API}/patients/${patientId}/reports`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch reports");
        const json = await res.json();
        const data: Report[] = Array.isArray(json)
          ? json
          : (json.data ?? json.reports ?? []);
        setReports(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [patientId, PATIENT_API]);

  if (preview) {
    return (
      <FilePreviewModal
        title={preview.title}
        url={preview.fileUrl}
        fileType={preview.fileType}
        onClose={() => setPreview(null)}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              Medical Reports
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {patientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-muted)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border p-4 flex items-center gap-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "var(--bg-muted)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded" style={{ background: "var(--bg-muted)" }} />
                    <div className="h-2 w-24 rounded" style={{ background: "var(--bg-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium" style={{ color: "var(--danger-text)" }}>{error}</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                style={{ background: "var(--bg-muted)" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No reports found</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                This patient has not uploaded any medical reports yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const badge = TYPE_BADGE_STYLE[report.reportType] ?? TYPE_BADGE_STYLE.other;
                const date = report.reportDate
                  ? new Date(report.reportDate).toLocaleDateString()
                  : new Date(report.uploadedAt).toLocaleDateString();
                return (
                  <div
                    key={report.id}
                    className="rounded-xl border p-4 flex items-center gap-4 transition-colors"
                    style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: badge.bg }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={badge.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {report.title}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {REPORT_TYPE_LABELS[report.reportType]}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {date}
                        {report.description ? ` · ${report.description}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreview(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                      style={{ background: "var(--brand-surface)", color: "var(--brand-text)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorDashboard() {
  const { user } = useUser();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsModal, setReportsModal] = useState<{ patientId: string; patientName: string } | null>(null);

  const APPOINTMENT_API =
    process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004/api/v1";
  const DOCTOR_API_URL =
    process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

  const doctorName = (user as any)?.name || "Doctor";

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Not authenticated");
        const { accessToken } = await tokenRes.json();

        // Resolve the doctor's own ID from the doctor service
        const doctorRes = await fetch(`${DOCTOR_API_URL}/doctors/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!doctorRes.ok) throw new Error("Could not resolve doctor profile");
        const doctorData = await doctorRes.json();
        const doctorId =
          doctorData?.data?._id ?? doctorData?.data?.id ?? doctorData?._id ?? doctorData?.id;
        if (!doctorId) throw new Error("Doctor ID not found");

        const res = await fetch(`${APPOINTMENT_API}/appointments/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const json = await res.json();

        // API returns a plain array; guard against wrapped formats too
        const data = Array.isArray(json) ? json : (json.data?.content || json.data || []);
        const liveAppointments = Array.isArray(data)
          ? data.map((apt: Record<string, unknown>) => ({
              id: apt.id || apt._id || "N/A",
              patientId: apt.patientId || "Unknown",
              patientName: apt.patientName || String(apt.patientId || "Patient"),
              time: apt.startTime || apt.time
                ? String(apt.startTime || apt.time)
                : apt.appointmentDate
                  ? new Date(apt.appointmentDate as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "",
              date: apt.appointmentDate
                ? new Date(apt.appointmentDate as string).toLocaleDateString()
                : String(apt.date || "TBD"),
              type: apt.type || "IN_PERSON",
              status: apt.status || "PENDING",
              notes: apt.notes || "",
            }))
          : [];

        setAppointments(liveAppointments);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [APPOINTMENT_API, DOCTOR_API_URL]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) return;
      const { accessToken } = await tokenRes.json();

      const res = await fetch(
        `${APPOINTMENT_API}/appointments/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json().catch(() => null);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: updated?.status ?? status } : a
        )
      );
    } catch {
      alert("Failed to update appointment status.");
    }
  };

  const joinVideoCall = async (appointmentId: string) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) return;
      const { accessToken } = await tokenRes.json();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TELEMEDICINE_API || "http://localhost:8090/api/v1"}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ appointmentId }),
        }
      );
      if (res.ok) {
        const session = await res.json();
        window.open(session.jitsiUrl || session.data?.jitsiUrl, "_blank");
      } else {
        alert("Could not create session. Try again.");
      }
    } catch {
      alert("Telemedicine service unavailable.");
    }
  };

  const viewReports = (patientId: string, patientName: string) => {
    setReportsModal({ patientId, patientName });
  };

  const pendingCount = appointments.filter((a) => a.status === "PENDING").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const totalCount = appointments.length;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Good morning, {doctorName}
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Your patient queue for today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/availability"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: "var(--brand)",
                color: "var(--brand-text)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--brand-surface)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Manage Schedule
            </Link>
            <Link
              href="/prescriptions"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: "var(--brand)",
                color: "var(--brand-text)",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "var(--brand-surface)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              Issue Prescription
            </Link>
          </div>
        </header>

        {/* ── Stats Row ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pending */}
            <div
              className="rounded-xl border p-5 flex items-start justify-between"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wider font-medium mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Pending
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {pendingCount}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--accent-surface)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            {/* Confirmed */}
            <div
              className="rounded-xl border p-5 flex items-start justify-between"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wider font-medium mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Confirmed
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{ color: "var(--brand)" }}
                >
                  {confirmedCount}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--brand-surface)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>

            {/* Total Today */}
            <div
              className="rounded-xl border p-5 flex items-start justify-between"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <p
                  className="text-xs uppercase tracking-wider font-medium mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Total Today
                </p>
                <p
                  className="text-3xl font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {totalCount}
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--bg-muted)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ── Patient Queue ── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2
              className="text-lg font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              Patient Queue
            </h2>
            {!loading && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--bg-muted)",
                  color: "var(--text-secondary)",
                }}
              >
                {totalCount} appointment{totalCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <SkeletonAppointmentRow />
              <SkeletonAppointmentRow />
              <SkeletonAppointmentRow />
            </div>
          ) : appointments.length === 0 ? (
            <div
              className="rounded-xl border p-12 text-center"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--bg-muted)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                No appointments scheduled for today
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Your confirmed bookings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const initials = apt.patientName
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div
                    key={apt.id}
                    className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                    style={{
                      background: "var(--bg-elevated)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Left: avatar + info */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                        style={{ background: "var(--brand)" }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-medium text-sm"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {apt.patientName}
                          </span>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {apt.date} · {apt.time} · {apt.type === "VIRTUAL" ? "Virtual" : "In-Person"}
                        </p>
                      </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {apt.status === "PENDING" ? (
                        <>
                          <button
                            onClick={() => updateStatus(apt.id, "CANCELLED")}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{
                              background: "var(--danger-surface)",
                              color: "var(--danger-text)",
                            }}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                            style={{ background: "var(--brand)" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "var(--brand-hover)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "var(--brand)";
                            }}
                          >
                            Confirm
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => viewReports(apt.patientId, apt.patientName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                            style={{
                              borderColor: "var(--border)",
                              color: "var(--text-secondary)",
                              background: "transparent",
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Reports
                          </button>

                          {apt.type === "VIRTUAL" && (
                            <button
                              onClick={() => joinVideoCall(apt.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                              style={{ background: "var(--brand)" }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "var(--brand-hover)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "var(--brand)";
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                              </svg>
                              Start Session
                            </button>
                          )}

                          <Link
                            href={`/prescriptions?patientId=${apt.patientId}&appointmentId=${apt.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-white transition-colors"
                            style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
                          >
                            + Issue Rx
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {reportsModal && (
        <PatientReportsModal
          patientId={reportsModal.patientId}
          patientName={reportsModal.patientName}
          onClose={() => setReportsModal(null)}
        />
      )}
    </div>
  );
}
