"use client";

import { useEffect, useRef, useState } from "react";
import FilePreviewModal from "@/components/FilePreviewModal";

const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

// ─── Types ────────────────────────────────────────────────────────

interface PendingDoctor {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  qualification: string | null;
  bio: string | null;
  consultationFee: number | null;
  isVerified: boolean;
  createdAt: string;
  credentialDocuments?: string[];
}

type Toast = { id: number; message: string; kind: "success" | "error" };

// ─── Toast ────────────────────────────────────────────────────────

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          aria-live="assertive"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.kind === "success" ? "bg-teal-600 text-white" : "bg-red-600 text-white"}`}
        >
          <span>{t.message}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="ml-auto opacity-80 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const push = (message: string, kind: "success" | "error" = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };
  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return { toasts, push, dismiss };
}

// ─── Verify/Reject Modal ──────────────────────────────────────────

function VerifyModal({
  doctor,
  onConfirm,
  onClose,
}: {
  doctor: PendingDoctor & { credentialDocuments?: string[] };
  onConfirm: (doctorId: string, approve: boolean, notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [previewFile, setPreviewFile] = useState<{ title: string; url: string; fileType: string } | null>(null);

  const handleSubmit = async (approve: boolean) => {
    setAction(approve ? "approve" : "reject");
    setSubmitting(true);
    try {
      await onConfirm(doctor.id, approve, notes);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Doctor Application</h2>
          <button onClick={onClose} aria-label="Close modal" className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Doctor summary */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-4 space-y-1">
            <p className="font-semibold text-gray-900 dark:text-white">{doctor.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{doctor.email}</p>
            {doctor.specialization && <p className="text-sm text-gray-700 dark:text-gray-300">Specialization: {doctor.specialization}</p>}
            {doctor.qualification && <p className="text-sm text-gray-700 dark:text-gray-300">Qualification: {doctor.qualification}</p>}
            {doctor.consultationFee != null && (
              <p className="text-sm text-gray-700 dark:text-gray-300">Fee: LKR {Number(doctor.consultationFee).toFixed(2)}</p>
            )}
          </div>

          {/* Credential documents */}
          {doctor.credentialDocuments && doctor.credentialDocuments.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Credential Documents</label>
              <div className="space-y-2">
                {doctor.credentialDocuments.map((p, i) => {
                  const filename = p.split('/').pop() || `document-${i + 1}`;
                  const proxyUrl = `/api/admin/credential?path=${encodeURIComponent(p)}`;
                  const ext = filename.split('.').pop() || '';
                  const fileType = ext.toLowerCase() === 'pdf' ? 'application/pdf' : `image/${ext.toLowerCase()}`;
                  return (
                    <div key={p} className="flex items-center justify-between rounded-lg p-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      <div className="min-w-0 mr-3 text-sm truncate">
                        <div className="font-medium text-gray-900 dark:text-white">{filename}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFile({ title: filename, url: proxyUrl, fileType })}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {previewFile && (
            <FilePreviewModal
              title={previewFile.title}
              url={previewFile.url}
              fileType={previewFile.fileType}
              onClose={() => setPreviewFile(null)}
            />
          )}

          {/* Notes field */}
          <div>
            <label htmlFor="modal-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin notes (optional — visible to doctor)
            </label>
            <textarea
              id="modal-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for approval or rejection…"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {submitting && action === "approve" ? "Approving…" : "Approve ✓"}
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {submitting && action === "reject" ? "Rejecting…" : "Reject ✗"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────

function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-48" />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  const { toasts, push, dismiss } = useToast();
  const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Not authenticated");
    const { accessToken } = await res.json();
    return accessToken;
  }

  async function fetchPendingDoctors() {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      // Calls Nethmi's Doctor Service: GET /doctors/pending (admin-only route)
      const res = await fetch(`${DOCTOR_API}/doctors/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Forbidden: Admin access required.");
        if (res.status === 404) {
          // Doctor service may not expose /pending yet — return empty
          setDoctors([]);
          return;
        }
        throw new Error("Failed to load pending doctors.");
      }
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPendingDoctors(); }, []);

  const handleVerify = async (doctorId: string, approve: boolean, notes: string) => {
    try {
      const token = await getToken();
      // Calls Nethmi's Doctor Service: PUT /doctors/:id/verify
      const res = await fetch(`${DOCTOR_API}/doctors/${doctorId}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ approved: approve, notes }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to update verification status.");
      }

      // Remove from pending list after action
      setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
      setSelectedDoctor(null);
      push(approve ? "Doctor approved successfully!" : "Doctor application rejected.", approve ? "success" : "error");
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Action failed.", "error");
      throw err; // re-throw so modal keeps spinner
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      {selectedDoctor && (
        <VerifyModal
          doctor={selectedDoctor}
          onConfirm={handleVerify}
          onClose={() => setSelectedDoctor(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Doctor Verification Queue</h1>
          <p className="page-subtitle">Review and approve or reject doctor registration applications.</p>
        </div>
        {!loading && !error && (
          <span className="badge badge-warning">{doctors.length} pending</span>
        )}
      </div>

      {loading ? (
        <DoctorCardSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-8 text-center text-red-500 dark:text-red-400">
          {error}
          <button onClick={fetchPendingDoctors} className="block mx-auto mt-3 text-sm text-teal-600 dark:text-teal-400 underline">Retry</button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="glass-card-premium">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="empty-state-title">All clear!</div>
            <div className="empty-state-desc">No pending doctor applications at this time.</div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="glass-card-premium p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm shrink-0">
                  {doctor.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{doctor.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doctor.email}</p>
                </div>
              </div>

              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="inline text-gray-500 dark:text-gray-400">Specialization: </dt>
                  <dd className="inline font-medium text-gray-900 dark:text-white">{doctor.specialization || "—"}</dd>
                </div>
                <div>
                  <dt className="inline text-gray-500 dark:text-gray-400">Qualification: </dt>
                  <dd className="inline font-medium text-gray-900 dark:text-white">{doctor.qualification || "—"}</dd>
                </div>
                {doctor.consultationFee != null && (
                  <div>
                    <dt className="inline text-gray-500 dark:text-gray-400">Fee: </dt>
                    <dd className="inline font-medium text-gray-900 dark:text-white">LKR {Number(doctor.consultationFee).toFixed(2)}</dd>
                  </div>
                )}
                <div>
                  <dt className="inline text-gray-500 dark:text-gray-400">Applied: </dt>
                  <dd className="inline font-medium text-gray-900 dark:text-white">{new Date(doctor.createdAt).toLocaleDateString()}</dd>
                </div>
              </dl>

              <button
                onClick={async () => {
                  try {
                    const token = await getToken();
                    const res = await fetch(`${DOCTOR_API}/doctors/${doctor.id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                      const body = await res.json();
                      // doctor service wraps in { success, data }
                      const doc = body?.data ?? body;
                      setSelectedDoctor({ ...doctor, ...(doc || {}) });
                    } else {
                      setSelectedDoctor(doctor);
                    }
                  } catch {
                    setSelectedDoctor(doctor);
                  }
                }}
                className="w-full rounded-xl bg-teal-600 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                Review Application
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
