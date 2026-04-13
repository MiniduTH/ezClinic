"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";

// ─── Types ────────────────────────────────────────────────────────

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

interface PaginatedReports {
  data: Report[];
  total: number;
  page: number;
  limit: number;
}

type Toast = { id: number; message: string; kind: "success" | "error" };

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  lab: "Lab Result",
  imaging: "Imaging",
  prescription: "Prescription",
  other: "Other",
};

const TYPE_BADGE: Record<ReportType, string> = {
  lab: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  imaging: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  prescription: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

function getErrorMessage(e: unknown, fb: string) {
  return e instanceof Error ? e.message : fb;
}

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
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="ml-auto opacity-80 hover:opacity-100">✕</button>
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

// ─── Skeleton ─────────────────────────────────────────────────────

function ReportsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  );
}

// ─── Report Detail Modal ──────────────────────────────────────────

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const isImage = report.fileType.startsWith("image/");
  const isPdf = report.fileType === "application/pdf";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="min-w-0 mr-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{report.title}</h2>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className={`rounded-full px-2 py-0.5 font-medium ${TYPE_BADGE[report.reportType]}`}>
                {REPORT_TYPE_LABELS[report.reportType]}
              </span>
              <span>{new Date(report.uploadedAt).toLocaleDateString()}</span>
              {report.fileSize && <span>{(report.fileSize / 1024).toFixed(0)} KB</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close report preview" className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview area */}
        <div className="p-6 space-y-4">
          {isImage && (
            <img src={report.fileUrl} alt={report.title} className="w-full max-h-80 object-contain rounded-xl border border-gray-100 dark:border-gray-700" />
          )}
          {isPdf && (
            <iframe src={report.fileUrl} title={report.title} className="w-full h-80 rounded-xl border border-gray-100 dark:border-gray-700" />
          )}
          {!isImage && !isPdf && (
            <div className="flex h-32 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/40 text-gray-400 dark:text-gray-500 text-sm">
              Preview not available for this file type
            </div>
          )}

          {report.description && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-900 dark:text-white">{report.description}</p>
            </div>
          )}

          {report.reportDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Report date: <span className="font-medium text-gray-900 dark:text-white">{new Date(report.reportDate).toLocaleDateString()}</span>
            </p>
          )}

          <a
            href={report.fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useUser();
  const { toasts, push, dismiss } = useToast();

  const [patientId, setPatientId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterType, setFilterType] = useState<ReportType | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    title: "",
    reportType: "other" as ReportType,
    description: "",
    reportDate: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Detail modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Not authenticated");
    const { accessToken } = await res.json();
    return accessToken;
  }

  // Load patient ID first, then reports
  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getToken();
        const res = await fetch(`${PATIENT_API}/patients/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load patient profile.");
        const patient = await res.json();
        setPatientId(patient.id);
      } catch (err) {
        setError(getErrorMessage(err, "Failed to load profile."));
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!patientId) return;
    fetchReports();
  }, [patientId, page, filterType, filterDateFrom, filterDateTo]);

  async function fetchReports() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (filterType) params.set("reportType", filterType);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);

      const res = await fetch(`${PATIENT_API}/patients/${patientId}/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load reports.");
      const result: PaginatedReports = await res.json();
      setReports(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load reports."));
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    // Pre-fill title from filename if empty
    if (!uploadForm.title) {
      setUploadForm((prev) => ({ ...prev, title: file.name.replace(/\.[^.]+$/, "") }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadForm.title || !patientId) return;
    setUploading(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("title", uploadForm.title);
      form.append("reportType", uploadForm.reportType);
      if (uploadForm.description) form.append("description", uploadForm.description);
      if (uploadForm.reportDate) form.append("reportDate", uploadForm.reportDate);
      form.append("file", uploadFile);

      const res = await fetch(`${PATIENT_API}/patients/${patientId}/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Upload failed.");
      }
      const uploaded: Report = await res.json();
      setReports((prev) => [uploaded, ...prev]);
      setTotal((t) => t + 1);
      setUploadForm({ title: "", reportType: "other", description: "", reportDate: "" });
      setUploadFile(null);
      push("Report uploaded successfully!", "success");
    } catch (err) {
      push(getErrorMessage(err, "Upload failed."), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!patientId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${PATIENT_API}/patients/${patientId}/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed.");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setTotal((t) => Math.max(0, t - 1));
      push("Report deleted.", "success");
    } catch (err) {
      push(getErrorMessage(err, "Delete failed."), "error");
    }
  };

  const applyFilters = () => { setPage(1); fetchReports(); };
  const clearFilters = () => {
    setFilterType("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Medical Reports</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Upload, view, and manage your medical documents. {total > 0 && <span className="font-medium text-gray-900 dark:text-white">{total} total</span>}
        </p>
      </div>

      {/* Upload dropzone */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload New Report</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
              dragOver
                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-600"
            }`}
          >
            <input
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              aria-label="Select a file to upload"
            />
            <svg className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {uploadFile ? (
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">{uploadFile.name} ({(uploadFile.size / 1024).toFixed(0)} KB)</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drag & drop or click to select</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PDF, JPEG, PNG — max 10 MB</p>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="u-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
              <input
                id="u-title" type="text" required
                value={uploadForm.title}
                onChange={(e) => setUploadForm((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label htmlFor="u-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
              <select
                id="u-type"
                value={uploadForm.reportType}
                onChange={(e) => setUploadForm((p) => ({ ...p, reportType: e.target.value as ReportType }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-teal-500"
              >
                <option value="lab">Lab Result</option>
                <option value="imaging">Imaging</option>
                <option value="prescription">Prescription</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="u-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Date</label>
              <input
                id="u-date" type="date"
                value={uploadForm.reportDate}
                onChange={(e) => setUploadForm((p) => ({ ...p, reportDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label htmlFor="u-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
              <input
                id="u-desc" type="text"
                value={uploadForm.description}
                onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={uploading || !uploadFile || !uploadForm.title}
            className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {uploading ? "Uploading…" : "Upload Report"}
          </button>
        </form>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="f-type" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
            <select
              id="f-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ReportType | "")}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-teal-500"
            >
              <option value="">All types</option>
              <option value="lab">Lab Result</option>
              <option value="imaging">Imaging</option>
              <option value="prescription">Prescription</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="f-from" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input id="f-from" type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-teal-500" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="f-to" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input id="f-to" type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white px-3 py-2 outline-none focus:border-teal-500" />
          </div>
          <button onClick={applyFilters} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">Filter</button>
          {(filterType || filterDateFrom || filterDateTo) && (
            <button onClick={clearFilters} className="rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Clear</button>
          )}
        </div>
      </div>

      {/* Report list */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>
        ) : loading ? (
          <div className="p-6"><ReportsSkeleton /></div>
        ) : reports.length === 0 ? (
          <div className="p-16 flex flex-col items-center text-center">
            <svg className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filterType || filterDateFrom || filterDateTo
                ? "Try adjusting your filters."
                : "Upload your first medical report using the form above."}
            </p>
          </div>
        ) : (
          <>
            {/* Table — desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/40">
                  <tr>
                    {["Title", "Type", "Date", "Size", "Actions"].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                        {r.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{r.description}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_BADGE[r.reportType]}`}>
                          {REPORT_TYPE_LABELS[r.reportType]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(r.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {r.fileSize ? `${(r.fileSize / 1024).toFixed(0)} KB` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="rounded-lg border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                          >
                            View
                          </button>
                          <a
                            href={r.fileUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            aria-label={`Download ${r.title}`}
                          >
                            Download
                          </a>
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label={`Delete report ${r.title}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Card list — mobile */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {reports.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${TYPE_BADGE[r.reportType]}`}>{REPORT_TYPE_LABELS[r.reportType]}</span>
                        <span>{new Date(r.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedReport(r)} className="rounded-lg border border-teal-200 dark:border-teal-800 px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">View</button>
                    <a href={r.fileUrl} download target="_blank" rel="noopener noreferrer" className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">Download</a>
                    <button onClick={() => handleDelete(r.id)} className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400" aria-label={`Delete ${r.title}`}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-5 py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {page} of {totalPages} ({total} reports)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
