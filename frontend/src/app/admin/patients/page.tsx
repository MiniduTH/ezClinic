"use client";

import { useEffect, useRef, useState } from "react";

const PATIENT_API = process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";

type PatientStatus = "active" | "inactive" | "suspended";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  status: PatientStatus;
  createdAt: string;
}

type Toast = { id: number; message: string; kind: "success" | "error" };

const STATUS_BADGE: Record<PatientStatus, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

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

function TableSkeleton() {
  return (
    <div className="animate-pulse p-4 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-gray-700" />
      ))}
    </div>
  );
}

export default function AdminPatientList() {
  const { toasts, push, dismiss } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PatientStatus | "">("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Not authenticated");
    const { accessToken } = await res.json();
    return accessToken;
  }

  async function fetchPatients() {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${PATIENT_API}/admins/platform/patients?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) throw new Error("Forbidden: Admin access required.");
        throw new Error("Failed to fetch patients.");
      }
      setPatients(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPatients(); }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); fetchPatients(); };

  const cycleStatus = (current: PatientStatus): PatientStatus => {
    if (current === "active") return "suspended";
    if (current === "suspended") return "inactive";
    return "active";
  };

  const updateStatus = async (patientId: string, newStatus: PatientStatus) => {
    setUpdatingId(patientId);
    try {
      const token = await getToken();
      const res = await fetch(`${PATIENT_API}/admins/platform/patients/${patientId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const updated: Patient = await res.json();
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, status: updated.status } : p)));
      push(`Status updated to "${newStatus}".`, "success");
    } catch (err: unknown) {
      push(err instanceof Error ? err.message : "Failed to update status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <ToastContainer toasts={toasts} dismiss={dismiss} />

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Patient Management</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {loading ? "Loading…" : `${patients.length} patient${patients.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Search + filter bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="sr-only">Search patients</label>
          <input
            id="search"
            type="search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div>
          <label htmlFor="status-filter" className="sr-only">Filter by status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PatientStatus | "")}
            className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          Search
        </button>
      </form>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="p-8 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-b-2xl">
            {error}
            <button onClick={fetchPatients} className="block mx-auto mt-3 text-sm text-teal-600 dark:text-teal-400 underline">Retry</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/40">
                  <tr>
                    {["Patient", "Contact", "Gender / DOB", "Joined", "Status", "Actions"].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        No patients found{search || statusFilter ? " matching your filters" : ""}.
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm shrink-0">
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{patient.name}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{patient.id.split("-")[0]}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-900 dark:text-white">{patient.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{patient.phone || "—"}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {patient.gender ? (
                            <span className="capitalize rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-xs font-medium mr-2">
                              {patient.gender}
                            </span>
                          ) : null}
                          {patient.dob ? new Date(patient.dob).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(patient.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[patient.status] ?? STATUS_BADGE.active}`}>
                            {patient.status ?? "active"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => updateStatus(patient.id, cycleStatus(patient.status ?? "active"))}
                            disabled={updatingId === patient.id}
                            className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                            aria-label={`Change status of ${patient.name}`}
                          >
                            {updatingId === patient.id ? "Updating…" : "Toggle Status"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {patients.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No patients found.</p>
              ) : (
                patients.map((p) => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.email}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_BADGE[p.status] ?? STATUS_BADGE.active}`}>
                        {p.status ?? "active"}
                      </span>
                    </div>
                    <button
                      onClick={() => updateStatus(p.id, cycleStatus(p.status ?? "active"))}
                      disabled={updatingId === p.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
                    >
                      {updatingId === p.id ? "Updating…" : "Toggle Status"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


