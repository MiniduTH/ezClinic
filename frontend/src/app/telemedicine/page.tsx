"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_PATH_TELEMEDICINE;

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_GATEWAY_PATH_TELEMEDICINE is not defined");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  appointmentId: string;
  roomId: string;
  token?: string;
  jitsiUrl: string;
  startedAt: string;
  endedAt?: string | null;
}

interface SymptomCheck {
  id: string;
  patientId: string;
  symptoms: string;
  aiSuggestion: string;
  createdAt: string;
}

interface Notification {
  id: string;
  userId: string;
  recipientEmail: string;
  type: "EMAIL" | "SMS" | "PUSH";
  subject: string;
  content: string;
  status: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
  sentAt?: string | null;
}

type Tab = "sessions" | "symptoms" | "notifications";
type Toast = { type: "success" | "error"; text: string } | null;

// ─── Utility helpers ──────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ToastBanner({ toast }: { toast: Toast }) {
  if (!toast) return null;
  const isOk = toast.type === "success";
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
        isOk
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      <span className="text-base">{isOk ? "✓" : "✕"}</span>
      {toast.text}
    </div>
  );
}

function Spinner({ small }: { small?: boolean }) {
  const size = small ? "h-4 w-4" : "h-6 w-6";
  return (
    <svg
      className={`animate-spin ${size} text-current`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── STATUS BADGES ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: "PENDING" | "SENT" | "FAILED" }) {
  const styles = {
    SENT: "bg-emerald-100 text-emerald-700",
    PENDING: "bg-amber-100 text-amber-700",
    FAILED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: "EMAIL" | "SMS" | "PUSH" }) {
  const icons = { EMAIL: "✉️", SMS: "💬", PUSH: "🔔" };
  const styles = {
    EMAIL: "bg-blue-100 text-blue-700",
    SMS: "bg-violet-100 text-violet-700",
    PUSH: "bg-orange-100 text-orange-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[type]}`}
    >
      {icons[type]} {type}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function TelemedicinePage() {
  const [activeTab, setActiveTab] = useState<Tab>("sessions");

  const tabs: { key: Tab; label: string; icon: string; gradient: string }[] = [
    {
      key: "sessions",
      label: "Video Sessions",
      icon: "📹",
      gradient: "from-blue-600 to-indigo-600",
    },
    {
      key: "symptoms",
      label: "AI Symptom Checker",
      icon: "🤖",
      gradient: "from-teal-600 to-emerald-600",
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: "🔔",
      gradient: "from-violet-600 to-purple-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Telemedicine &amp; Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage video consultations, AI symptom checks, and email notifications.
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-xl border transition-all ${
                active
                  ? `bg-gradient-to-r ${t.gradient} text-white border-transparent shadow-sm`
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div>
        {activeTab === "sessions" && <SessionsTab />}
        {activeTab === "symptoms" && <SymptomCheckerTab />}
        {activeTab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 1 — VIDEO SESSIONS
// ═════════════════════════════════════════════════════════════════════════════

function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  // Create session modal
  const [showModal, setShowModal] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [creating, setCreating] = useState(false);

  // Active Jitsi iframe
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: Session[] = await res.json();
      setSessions(data);
      setFetched(true);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error fetching sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async () => {
    if (!appointmentId.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "Failed to create session");
      }
      const newSession: Session = await res.json();
      setSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setShowModal(false);
      setAppointmentId("");
      showToast("success", "Session created! Jitsi room is live below.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleEnd = async (sessionId: string) => {
    if (!confirm("End this video session?")) return;
    try {
      const res = await fetch(`${API_BASE}/sessions/${sessionId}/end`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to end session");
      const updated: Session = await res.json();
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? updated : s))
      );
      if (activeSession?.id === sessionId) setActiveSession(null);
      showToast("success", "Session ended.");
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "End failed");
    }
  };

  const activeSessions = sessions.filter((s) => !s.endedAt);
  const pastSessions = sessions.filter((s) => !!s.endedAt);

  return (
    <div className="space-y-6">
      <ToastBanner toast={toast} />

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {fetched ? `${sessions.length} session(s) found` : "Loading sessions…"}
        </p>
        <div className="flex gap-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? <Spinner small /> : "↻ Refresh"}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-200 transition-all"
          >
            + New Session
          </button>
        </div>
      </div>

      {/* Live Jitsi Embed */}
      {activeSession && (
        <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-xl shadow-blue-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm flex items-center gap-2">
                🔴 <span>Live Session</span>
                <span className="text-white/70 font-normal">
                  Room: {activeSession.roomId}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEnd(activeSession.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                End Session
              </button>
              <button
                onClick={() => setActiveSession(null)}
                className="px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <iframe
            src={activeSession.jitsiUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-[520px] bg-gray-900"
            title={`Jitsi session — ${activeSession.roomId}`}
          />
        </div>
      )}

      {/* Active Sessions */}
      {loading && !fetched ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {activeSessions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🟢 Active Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isActive={activeSession?.id === s.id}
                    onJoin={() => setActiveSession(s)}
                    onEnd={() => handleEnd(s.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {pastSessions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                ⏹ Past Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastSessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    isActive={false}
                    onJoin={() => {}}
                    onEnd={() => {}}
                    ended
                  />
                ))}
              </div>
            </div>
          )}

          {fetched && sessions.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">📹</p>
              <p className="text-sm">No sessions yet. Create one to get started.</p>
            </div>
          )}
        </>
      )}

      {/* Create Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
              <h2 className="text-lg font-semibold text-white">
                Create Video Session
              </h2>
              <p className="text-sm text-white/70 mt-0.5">
                A Jitsi Meet room will be created for this appointment.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={appointmentId}
                  onChange={(e) => setAppointmentId(e.target.value)}
                  placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowModal(false);
                  setAppointmentId("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !appointmentId.trim()}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {creating && <Spinner small />}
                {creating ? "Creating…" : "Create & Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  isActive,
  onJoin,
  onEnd,
  ended = false,
}: {
  session: Session;
  isActive: boolean;
  onJoin: () => void;
  onEnd: () => void;
  ended?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-5 space-y-3 transition-all ${
        isActive
          ? "border-blue-400 ring-2 ring-blue-100"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {ended ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                ENDED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ACTIVE
              </span>
            )}
            {isActive && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                IN ROOM
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-mono">
            Room: <span className="text-gray-700 font-semibold">{session.roomId}</span>
          </p>
          <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]" title={session.appointmentId}>
            Appt: {session.appointmentId.split("-")[0]}…
          </p>
        </div>
        <div className="text-right text-xs text-gray-400 shrink-0">
          <p>Started</p>
          <p className="text-gray-600 font-medium">{fmtDate(session.startedAt)}</p>
          {session.endedAt && (
            <>
              <p className="mt-1">Ended</p>
              <p className="text-gray-600 font-medium">{fmtDate(session.endedAt)}</p>
            </>
          )}
        </div>
      </div>

      {!ended && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={onJoin}
            disabled={isActive}
            className="flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-default transition-all"
          >
            {isActive ? "✓ Joined" : "▶ Join Session"}
          </button>
          <button
            onClick={onEnd}
            className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
          >
            End
          </button>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 2 — AI SYMPTOM CHECKER
// ═════════════════════════════════════════════════════════════════════════════

function SymptomCheckerTab() {
  const [patientId, setPatientId] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SymptomCheck | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  // History
  const [historyPatientId, setHistoryPatientId] = useState("");
  const [history, setHistory] = useState<SymptomCheck[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFetched, setHistoryFetched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim() || !symptoms.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/symptom-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, symptoms }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "Analysis failed");
      }
      const data: SymptomCheck = await res.json();
      setResult(data);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const fetchHistory = async () => {
    if (!historyPatientId.trim()) return;
    setLoadingHistory(true);
    setHistory([]);
    setHistoryFetched(false);
    try {
      const res = await fetch(
        `${API_BASE}/symptom-checks/patient/${historyPatientId}`
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      const data: SymptomCheck[] = await res.json();
      setHistory(data);
      setHistoryFetched(true);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Error fetching history");
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastBanner toast={toast} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🤖 Analyse Symptoms
            </h2>
            <p className="text-sm text-white/70 mt-0.5">
              Powered by Google Gemini AI
            </p>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="UUID of the patient"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe Symptoms <span className="text-red-500">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={5}
                placeholder="e.g. I have had a persistent headache for 3 days, mild fever around 37.8°C, and fatigue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Be as detailed as possible for a better AI suggestion.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting || !patientId.trim() || !symptoms.trim()}
              className="w-full py-3 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting && <Spinner small />}
              {submitting ? "Analysing…" : "Analyse Symptoms"}
            </button>
          </form>
        </div>

        {/* Right — AI Response */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-900">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              💡 AI Suggestion
            </h2>
            <p className="text-sm text-white/50 mt-0.5">
              This is not a diagnosis. Always consult a qualified doctor.
            </p>
          </div>
          <div className="p-6">
            {submitting ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-4">
                <Spinner />
                <p className="text-sm">Gemini is analysing symptoms…</p>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-2xl shrink-0">🧬</span>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
                      Gemini Analysis
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {result.aiSuggestion}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium text-gray-500">Patient ID:</span>{" "}
                    <span className="font-mono">{result.patientId}</span>
                  </p>
                  <p>
                    <span className="font-medium text-gray-500">Checked at:</span>{" "}
                    {fmtDate(result.createdAt)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium">
                    ⚠️ AI suggestions are preliminary only. Please consult a
                    licensed medical professional for diagnosis and treatment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-3">
                <span className="text-5xl">🤖</span>
                <p className="text-sm text-gray-400">
                  Submit symptoms to see the AI analysis here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-500">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            🕑 Symptom Check History
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={historyPatientId}
              onChange={(e) => setHistoryPatientId(e.target.value)}
              placeholder="Enter Patient UUID to view history"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
            />
            <button
              onClick={fetchHistory}
              disabled={loadingHistory || !historyPatientId.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-lg disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loadingHistory && <Spinner small />}
              {loadingHistory ? "Loading…" : "Fetch History"}
            </button>
          </div>

          {historyFetched && (
            <>
              {history.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No records found for this patient.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((check) => (
                    <div
                      key={check.id}
                      className="border border-gray-100 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === check.id ? null : check.id
                          )
                        }
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl shrink-0">🧬</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {check.symptoms.length > 60
                                ? check.symptoms.slice(0, 60) + "…"
                                : check.symptoms}
                            </p>
                            <p className="text-xs text-gray-400">
                              {fmtDate(check.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-400 shrink-0 ml-2">
                          {expandedId === check.id ? "▲" : "▼"}
                        </span>
                      </button>
                      {expandedId === check.id && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 bg-gray-50">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                              Symptoms
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {check.symptoms}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-teal-600 uppercase mb-1">
                              AI Suggestion
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {check.aiSuggestion}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAB 3 — NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════

type NotifType = "EMAIL" | "SMS" | "PUSH";

function NotificationsTab() {
  const [toast, setToast] = useState<Toast>(null);

  // Send form
  const [form, setForm] = useState({
    userId: "",
    recipientEmail: "",
    type: "EMAIL" as NotifType,
    subject: "",
    content: "",
  });
  const [sending, setSending] = useState(false);

  // Lookup
  const [lookupId, setLookupId] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifsFetched, setNotifsFetched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || "Failed to send notification");
      }
      showToast("success", "Notification sent successfully!");
      setForm({ userId: "", recipientEmail: "", type: "EMAIL", subject: "", content: "" });
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const fetchNotifications = async () => {
    if (!lookupId.trim()) return;
    setLoadingNotifs(true);
    setNotifications([]);
    setNotifsFetched(false);
    try {
      const res = await fetch(`${API_BASE}/notifications/user/${lookupId}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data: Notification[] = await res.json();
      setNotifications(data);
      setNotifsFetched(true);
    } catch (err: unknown) {
      showToast("error", err instanceof Error ? err.message : "Fetch failed");
    } finally {
      setLoadingNotifs(false);
    }
  };

  const TYPES: NotifType[] = ["EMAIL", "SMS", "PUSH"];
  const typeIcons = { EMAIL: "✉️", SMS: "💬", PUSH: "🔔" };

  return (
    <div className="space-y-6">
      <ToastBanner toast={toast} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Send Notification Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              📤 Send Notification
            </h2>
            <p className="text-sm text-white/70 mt-0.5">
              Manually trigger an email notification to a user.
            </p>
          </div>
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => updateField("userId", e.target.value)}
                  required
                  placeholder="UUID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => updateField("recipientEmail", e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
            </div>

            {/* Notification Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField("type", t)}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                      form.type === t
                        ? "bg-violet-50 border-violet-400 text-violet-700"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {typeIcons[t]} {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                required
                placeholder="e.g. Your appointment is confirmed"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => updateField("content", e.target.value)}
                required
                rows={4}
                placeholder="Write the notification message…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-lg shadow-violet-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {sending && <Spinner small />}
              {sending ? "Sending…" : "Send Notification"}
            </button>
          </form>
        </div>

        {/* Notification Lookup */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-700 to-slate-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              🔍 Notification History
            </h2>
            <p className="text-sm text-white/60 mt-0.5">
              Look up notifications sent to a user.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter User UUID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 text-sm font-mono"
              />
              <button
                onClick={fetchNotifications}
                disabled={loadingNotifs || !lookupId.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 rounded-lg disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {loadingNotifs && <Spinner small />}
                {loadingNotifs ? "Loading…" : "Fetch"}
              </button>
            </div>

            {notifsFetched && (
              <>
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-6">
                    No notifications found for this user.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="border border-gray-100 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === n.id ? null : n.id)
                          }
                          className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className="text-base shrink-0 mt-0.5">
                              {typeIcons[n.type]}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {n.subject}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <TypeBadge type={n.type} />
                                <StatusBadge status={n.status} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                To: {n.recipientEmail}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2 text-right">
                            <p className="text-xs text-gray-400">
                              {fmtDate(n.createdAt)}
                            </p>
                            <span className="text-gray-400 text-xs">
                              {expandedId === n.id ? "▲" : "▼"}
                            </span>
                          </div>
                        </button>
                        {expandedId === n.id && (
                          <div className="px-4 pb-4 pt-3 bg-gray-50 border-t border-gray-100 space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Message
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {n.content}
                            </p>
                            {n.sentAt && (
                              <p className="text-xs text-gray-400">
                                Sent at: {fmtDate(n.sentAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {!notifsFetched && !loadingNotifs && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 gap-2">
                <span className="text-4xl">🔔</span>
                <p className="text-sm text-gray-400 text-center">
                  Enter a User UUID above and click Fetch to see notification history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
