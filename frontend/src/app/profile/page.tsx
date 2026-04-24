"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";

const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";
const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

// ─── Types ────────────────────────────────────────────────────────

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  avatarUrl: string | null;
  bloodType: string | null;
  allergies: string | null;
  emergencyContact: string | null;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string | null;
  qualification?: string | null;
  bio?: string | null;
  consultationFee?: number | null;
  isVerified?: boolean;
  createdAt?: string;
}

interface Report {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  reportType: "lab" | "imaging" | "prescription" | "other";
  description: string | null;
  reportDate: string | null;
  uploadedAt: string;
}

type Toast = { id: number; message: string; kind: "success" | "error" };

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// ─── Shared UI Primitives ─────────────────────────────────────────

function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          aria-live="assertive"
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            t.kind === "success"
              ? "bg-teal-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="ml-auto opacity-80 hover:opacity-100"
          >
            ✕
          </button>
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

function ProfileSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-72 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="rounded-3xl border border-gray-100 dark:border-gray-700 p-8 space-y-6">
        <div className="flex gap-6">
          <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-56 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function ErrorState({ message, href, label }: { message: string; href: string; label: string }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">{message}</h2>
      <Link href={href} className="text-teal-600 dark:text-teal-400 hover:underline">{label}</Link>
    </div>
  );
}

const INPUT_CLS =
  "mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500";
const LABEL_CLS = "block text-sm font-medium text-gray-700 dark:text-gray-300";

// ─── Patient Profile ──────────────────────────────────────────────

function PatientProfile() {
  const { user } = useUser();
  const { toasts, push, dismiss } = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Patient, string>>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  // Reports
  const [reports, setReports] = useState<Report[]>([]);
  const [reportForm, setReportForm] = useState({
    title: "",
    reportType: "other" as Report["reportType"],
    description: "",
    reportDate: "",
  });
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Could not authenticate");
    const { accessToken } = await res.json();
    return accessToken;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };

        const patientRes = await fetch(`${PATIENT_API}/patients/me`, { headers });
        if (!patientRes.ok) {
          if (patientRes.status === 404) { setIsNewPatient(true); setIsEditing(true); return; }
          if (patientRes.status === 403) throw new Error("This profile is only available to patient accounts.");
          throw new Error("Failed to fetch patient data.");
        }

        const data: Patient = await patientRes.json();
        setPatient(data);
        setFormData({ ...data, dob: data.dob ? data.dob.split("T")[0] : "" });

        const repRes = await fetch(`${PATIENT_API}/patients/${data.id}/reports?limit=50`, { headers });
        if (repRes.ok) {
          const { data: repData } = await repRes.json();
          setReports(Array.isArray(repData) ? repData : []);
        }
      } catch (err) {
        setError(getErrorMessage(err, "An error occurred."));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isNewPatient && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [isNewPatient, user]);

function validate(data: Partial<Patient>): boolean {
    const errs: Partial<Record<keyof Patient, string>> = {};
    if (!data.name?.trim()) errs.name = "Full name is required";
    if (!data.email?.trim()) errs.email = "Email is required";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleUpdate = async () => {
    if (!validate(formData)) return;
    setSaving(true);
    try {
      // Strip server-managed / read-only fields and avatar (managed by its own endpoint)
      const { id: _id, status: _status, createdAt: _createdAt, updatedAt: _updatedAt, avatarUrl: _avatarUrl, ...rest } = formData as any;
      const payload: Record<string, unknown> = { ...rest };
      // Coerce empty strings to null for optional fields
      (["dob", "phone", "gender", "address", "bloodType", "allergies", "emergencyContact"] as const).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      if (!payload.name && user?.name) payload.name = user.name;
      if (!payload.email && user?.email) payload.email = user.email;

      const token = await getToken();
      const url = isNewPatient ? `${PATIENT_API}/patients/register` : `${PATIENT_API}/patients/${patient!.id}`;
      const res = await fetch(url, {
        method: isNewPatient ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || "Failed to save patient profile.");
      }
      const updated: Patient = await res.json();
      setPatient(updated);
      setFormData({ ...updated, dob: updated.dob ? updated.dob.split("T")[0] : "" });
      setIsEditing(false);
      setIsNewPatient(false);
      setStep(1);
      push("Profile saved successfully!", "success");
    } catch (err) {
      push(getErrorMessage(err, "Failed to update."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < TOTAL_STEPS) {
      if (step === 1 && !validate(formData)) return;
      setStep((s) => s + 1);
    } else {
      handleUpdate();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("file", avatarFile);
      const res = await fetch(`${PATIENT_API}/patients/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Avatar upload failed.");
      const updated: Patient = await res.json();
      setPatient(updated);
      setAvatarFile(null);
      setAvatarPreview(null);
      push("Avatar updated!", "success");
    } catch (err) {
      push(getErrorMessage(err, "Avatar upload failed."), "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !reportForm.title || !patient) return;
    setUploadingReport(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("title", reportForm.title);
      form.append("reportType", reportForm.reportType);
      if (reportForm.description) form.append("description", reportForm.description);
      if (reportForm.reportDate) form.append("reportDate", reportForm.reportDate);
      form.append("file", reportFile);

      const res = await fetch(`${PATIENT_API}/patients/${patient.id}/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.message || "Failed to upload report.");
      }
      const uploaded: Report = await res.json();
      setReports((prev) => [uploaded, ...prev]);
      setReportForm({ title: "", reportType: "other", description: "", reportDate: "" });
      setReportFile(null);
      push("Report uploaded successfully!", "success");
    } catch (err) {
      push(getErrorMessage(err, "Failed to upload report."), "error");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleReportDelete = async (reportId: string) => {
    if (!patient) return;
    try {
      const token = await getToken();
      const res = await fetch(`${PATIENT_API}/patients/${patient.id}/reports/${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete report.");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      push("Report deleted.", "success");
    } catch (err) {
      push(getErrorMessage(err, "Failed to delete report."), "error");
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (error || (!patient && !isNewPatient)) {
    return <ErrorState message={error || "Patient not found"} href="/" label="Return Home" />;
  }

  const displayName = patient?.name || user?.name || "New Patient";
  const displayEmail = patient?.email || user?.email || "";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <PageShell title="Patient Profile" subtitle="Manage your personal details and medical reports.">

        {/* ── Hero ── */}
        <div className="profile-hero">
          <div className="profile-hero-banner" />
          <div className="profile-hero-body">
            <div className="profile-avatar-xl">
              {avatarPreview || patient?.avatarUrl ? (
                <img src={avatarPreview ?? patient!.avatarUrl!} alt={`${displayName} avatar`} />
              ) : (
                <span>{initials}</span>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 cursor-pointer rounded-full p-2 shadow ring-1 transition-colors"
                style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
                aria-label="Change profile photo"
              >
                <svg className="h-4 w-4" style={{ color: "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="profile-hero-info">
              <h2 className="profile-hero-name">{displayName}</h2>
              <p className="profile-hero-email">{displayEmail}</p>
              <div className="profile-hero-meta">
                <span className={`badge ${isNewPatient ? "badge-warning" : "badge-success"}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                  {isNewPatient ? "Profile incomplete" : (patient?.status ?? "active")}
                </span>
                {patient?.createdAt && (
                  <span className="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Joined <span className="meta-pill-strong">{new Date(patient.createdAt).toLocaleDateString()}</span>
                  </span>
                )}
                {patient?.phone && (
                  <span className="meta-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span className="meta-pill-strong">{patient.phone}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 shrink-0 pb-1">
              {avatarFile ? (
                <button onClick={handleAvatarUpload} disabled={uploadingAvatar} className="btn-gradient">
                  {uploadingAvatar ? "Uploading…" : "Save Avatar"}
                </button>
              ) : !isEditing ? (
                <button onClick={() => { setIsEditing(true); setStep(1); }} className="btn-gradient">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (isNewPatient) return;
                    setIsEditing(false);
                    setStep(1);
                    setFormErrors({});
                    setFormData({ ...patient, dob: patient?.dob ? patient.dob.split("T")[0] : "" });
                  }}
                  className="btn-ghost"
                  disabled={isNewPatient}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Medical Summary ── */}
        {!isNewPatient && patient && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-card-premium p-5 flex items-center gap-4">
              <div className="info-tile-icon" style={{ width: 44, height: 44 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="info-tile-label">Blood Type</div>
                <div className="info-tile-value truncate">{patient.bloodType || "—"}</div>
              </div>
            </div>
            <div className="glass-card-premium p-5 flex items-center gap-4">
              <div className="info-tile-icon" style={{ width: 44, height: 44 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="info-tile-label">Allergies</div>
                <div className="info-tile-value truncate">{patient.allergies || "None recorded"}</div>
              </div>
            </div>
            <div className="glass-card-premium p-5 flex items-center gap-4">
              <div className="info-tile-icon" style={{ width: 44, height: 44 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="info-tile-label">Emergency Contact</div>
                <div className="info-tile-value truncate">{patient.emergencyContact || "Not provided"}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Personal Information ── */}
        <div className="glass-card-premium p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <h3 className="section-heading">Personal Information</h3>
          </div>

            {!isEditing && patient ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  {
                    label: "Full name", value: patient.name,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                  },
                  {
                    label: "Gender", value: patient.gender || "Not specified", capitalize: true,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.6 5.6"/><path d="M19 5h-4"/><path d="M19 5v4"/></svg>,
                  },
                  {
                    label: "Date of Birth", value: patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not specified",
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                  },
                  {
                    label: "Phone", value: patient.phone || "Not specified",
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
                  },
                  {
                    label: "Address", value: patient.address || "No address provided", wide: true,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  },
                  {
                    label: "Blood Type", value: patient.bloodType || "Not specified",
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/></svg>,
                  },
                  {
                    label: "Allergies", value: patient.allergies || "None recorded", wide: true,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                  },
                  {
                    label: "Emergency Contact", value: patient.emergencyContact || "Not provided", wide: true,
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>,
                  },
                ].map(({ label, value, capitalize, wide, icon }) => (
                  <div key={label} className={`info-tile ${wide ? "sm:col-span-2" : ""}`}>
                    <div className="info-tile-icon">{icon}</div>
                    <div className="min-w-0 flex-1">
                      <dt className="info-tile-label">{label}</dt>
                      <dd className={`info-tile-value ${capitalize ? "capitalize" : ""}`}>{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5" noValidate>
                {/* Step indicator */}
                <div className="flex items-center gap-1 pb-2">
                  {[
                    { label: "Personal", num: 1 },
                    { label: "Health", num: 2 },
                    { label: "Emergency", num: 3 },
                  ].map(({ label, num }, i) => {
                    const isActive = step === num;
                    const isComplete = step > num;
                    return (
                      <Fragment key={label}>
                        <div className={`flex items-center gap-2 ${isActive ? "text-teal-600 dark:text-teal-400" : isComplete ? "text-teal-500 dark:text-teal-500" : "text-gray-400 dark:text-gray-600"}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? "bg-teal-600 text-white" : isComplete ? "bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                            {isComplete ? "✓" : num}
                          </div>
                          <span className="text-sm font-medium hidden sm:block">{label}</span>
                        </div>
                        {i < 2 && (
                          <div className={`flex-1 h-px mx-1 ${step > num ? "bg-teal-400 dark:bg-teal-600" : "bg-gray-200 dark:bg-gray-700"}`} />
                        )}
                      </Fragment>
                    );
                  })}
                </div>

                {/* Step 1 — Personal */}
                {step === 1 && (
                  <>
                    <div>
                      <label htmlFor="name" className={LABEL_CLS}>Full name</label>
                      <input
                        id="name" type="text" name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        required
                        aria-describedby={formErrors.name ? "name-err" : undefined}
                        className={INPUT_CLS}
                      />
                      {formErrors.name && <p id="name-err" className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="email" className={LABEL_CLS}>Email {!isNewPatient && "(cannot be changed)"}</label>
                      <input
                        id="email" type="email" name="email"
                        value={formData.email || ""}
                        onChange={handleInputChange}
                        required
                        disabled={!isNewPatient}
                        aria-describedby={formErrors.email ? "email-err" : undefined}
                        className={INPUT_CLS + (isNewPatient ? "" : " disabled:opacity-60 cursor-not-allowed")}
                      />
                      {formErrors.email && <p id="email-err" className="mt-1 text-xs text-red-500">{formErrors.email}</p>}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="phone" className={LABEL_CLS}>Phone</label>
                        <input id="phone" type="text" name="phone" value={formData.phone || ""} onChange={handleInputChange} className={INPUT_CLS} />
                      </div>
                      <div>
                        <label htmlFor="gender" className={LABEL_CLS}>Gender</label>
                        <select id="gender" name="gender" value={formData.gender || ""} onChange={handleInputChange} className={INPUT_CLS}>
                          <option value="">Select…</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2 — Health */}
                {step === 2 && (
                  <>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="dob" className={LABEL_CLS}>Date of Birth</label>
                        <input id="dob" type="date" name="dob" value={formData.dob || ""} onChange={handleInputChange} className={INPUT_CLS} />
                      </div>
                      <div>
                        <label htmlFor="bloodType" className={LABEL_CLS}>Blood Type</label>
                        <input id="bloodType" type="text" name="bloodType" placeholder="e.g. O+" value={formData.bloodType || ""} onChange={handleInputChange} className={INPUT_CLS} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="address" className={LABEL_CLS}>Address</label>
                      <textarea id="address" name="address" rows={3} value={formData.address || ""} onChange={handleInputChange} className={INPUT_CLS} />
                    </div>
                    <div>
                      <label htmlFor="allergies" className={LABEL_CLS}>Allergies</label>
                      <textarea id="allergies" name="allergies" rows={2} placeholder="e.g. Penicillin, pollen" value={formData.allergies || ""} onChange={handleInputChange} className={INPUT_CLS} />
                    </div>
                  </>
                )}

                {/* Step 3 — Emergency Contact */}
                {step === 3 && (
                  <div>
                    <label htmlFor="emergencyContact" className={LABEL_CLS}>Emergency Contact</label>
                    <input id="emergencyContact" type="text" name="emergencyContact" placeholder="Name — +94 77 123 4567" value={formData.emergencyContact || ""} onChange={handleInputChange} className={INPUT_CLS} />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Provide a name and phone number we can reach in case of emergency.</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="rounded-xl border border-gray-200 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-gradient"
                    style={{ padding: "12px 24px" }}
                  >
                    {step < TOTAL_STEPS ? "Next →" : saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
        </div>

        {/* ── Medical Reports ── */}
        {!isNewPatient && patient && (
          <div className="glass-card-premium p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="section-heading">Medical Reports</h3>
                  <Link href="/reports" className="text-sm font-medium hover:underline" style={{ color: "var(--brand-text)" }}>
                    View All →
                  </Link>
                </div>

                {/* Upload form */}
                <form onSubmit={handleReportUpload} className="rounded-2xl border border-dashed p-5 space-y-4" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload a new report (PDF, JPEG, PNG — max 10 MB)</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="rep-title" className={LABEL_CLS}>Report title</label>
                      <input
                        id="rep-title" type="text" required
                        value={reportForm.title}
                        onChange={(e) => setReportForm((p) => ({ ...p, title: e.target.value }))}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label htmlFor="rep-type" className={LABEL_CLS}>Type</label>
                      <select
                        id="rep-type"
                        value={reportForm.reportType}
                        onChange={(e) => setReportForm((p) => ({ ...p, reportType: e.target.value as Report["reportType"] }))}
                        className={INPUT_CLS}
                      >
                        <option value="lab">Lab Result</option>
                        <option value="imaging">Imaging</option>
                        <option value="prescription">Prescription</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="rep-date" className={LABEL_CLS}>Report date</label>
                      <input
                        id="rep-date" type="date"
                        value={reportForm.reportDate}
                        onChange={(e) => setReportForm((p) => ({ ...p, reportDate: e.target.value }))}
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label htmlFor="rep-desc" className={LABEL_CLS}>Description (optional)</label>
                      <input
                        id="rep-desc" type="text"
                        value={reportForm.description}
                        onChange={(e) => setReportForm((p) => ({ ...p, description: e.target.value }))}
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="rep-file" className={LABEL_CLS}>File</label>
                    <input
                      id="rep-file" type="file" required
                      accept=".pdf,image/jpeg,image/png"
                      onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                      className="mt-1 block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 dark:file:bg-teal-900/30 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-700 dark:file:text-teal-400 hover:file:bg-teal-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingReport || !reportFile || !reportForm.title}
                    className="btn-gradient disabled:opacity-60"
                  >
                    {uploadingReport ? "Uploading…" : "Upload Report"}
                  </button>
                </form>

                {/* Report list — shows last 5; link to /reports for full view */}
                <div className="space-y-2">
                  {reports.length === 0 ? (
                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-700/30 p-8 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No reports uploaded yet.</p>
                    </div>
                  ) : (
                    reports.slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize">{r.reportType}</span>
                            <span>{new Date(r.uploadedAt).toLocaleDateString()}</span>
                            {r.fileSize && <span>{(r.fileSize / 1024).toFixed(0)} KB</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800">
                            View
                          </a>
                          <button
                            onClick={() => handleReportDelete(r.id)}
                            className="rounded-lg border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label={`Delete report ${r.title}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {reports.length > 5 && (
                    <Link href="/reports" className="block text-center text-sm hover:underline py-2" style={{ color: "var(--brand-text)" }}>
                      View all {reports.length} reports →
                    </Link>
                  )}
                </div>
          </div>
        )}
      </PageShell>
    </>
  );
}

// ─── Doctor Profile ───────────────────────────────────────────────

function DoctorProfile() {
  const { user } = useUser();
  const { toasts, push, dismiss } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewDoctor, setIsNewDoctor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({});

  async function getToken(): Promise<string> {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Could not authenticate");
    const { accessToken } = await res.json();
    return accessToken;
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();
        const doctorRes = await fetch(`${DOCTOR_API}/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!doctorRes.ok) {
          if (doctorRes.status === 404) {
            setIsNewDoctor(true);
            setIsEditing(true);
            setFormData({ name: user?.name || "", email: user?.email || "" });
            return;
          }
          if (doctorRes.status === 403) throw new Error("This profile is only available to doctor accounts.");
          throw new Error("Failed to fetch doctor data.");
        }
        const json = await doctorRes.json();
        const data: Doctor = json.data ?? json;
        setDoctor(data);
        setFormData(data);
      } catch (err) {
        setError(getErrorMessage(err, "An error occurred."));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "consultationFee" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...formData,
        name: formData.name || user?.name || "",
        email: formData.email || user?.email || "",
        consultationFee: formData.consultationFee == null ? 0 : Number(formData.consultationFee),
      };
      const url = isNewDoctor ? `${DOCTOR_API}/doctors/register` : `${DOCTOR_API}/doctors/${doctor!.id}`;
      const res = await fetch(url, {
        method: isNewDoctor ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save doctor profile.");
      const resJson = await res.json();
      const updated: Doctor = resJson.data ?? resJson;
      setDoctor(updated);
      setFormData(updated);
      setIsEditing(false);
      setIsNewDoctor(false);
      push("Profile saved successfully!", "success");
    } catch (err) {
      push(getErrorMessage(err, "Failed to update."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;
  if (error || (!doctor && !isNewDoctor)) {
    return <ErrorState message={error || "Doctor not found"} href="/dashboard" label="Return to Dashboard" />;
  }

  const displayName = doctor?.name || user?.name || "New Doctor";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Banner */}
          <div className="relative h-28 bg-gradient-to-r from-teal-800 to-teal-600">
            <div className="absolute -bottom-10 left-8">
              <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-teal-700">{initials}</span>
              </div>
            </div>
            {!isEditing && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-white/15 hover:bg-white/25 text-white border border-white/30 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition-all"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="pt-14 pb-5 px-8 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <p className="mt-1 text-sm text-gray-500 break-all">{doctor?.email || user?.email || ""}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {doctor?.specialization && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-medium">
                      {doctor.specialization}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      doctor?.isVerified
                        ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                        : "bg-amber-50 border border-amber-100 text-amber-700"
                    }`}
                  >
                    {doctor?.isVerified ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pending Verification
                      </>
                    )}
                  </span>
                  {doctor?.createdAt && (
                    <span className="text-xs text-gray-400">
                      Member since{" "}
                      {new Date(doctor.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
              {isEditing && !isNewDoctor && (
                <button
                  onClick={() => { setIsEditing(false); setFormData(doctor || {}); }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {!isEditing && doctor ? (
              <div className="space-y-6">
                {/* Credentials grid */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    Professional Details
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qualification</p>
                      <p className="mt-1.5 font-semibold text-gray-900">{doctor.qualification || "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                      <p className="text-xs font-medium text-teal-600 uppercase tracking-wide">Consultation Fee</p>
                      <p className="mt-1.5 text-lg font-bold text-teal-800">
                        LKR{" "}
                        {Number(doctor.consultationFee || 0).toLocaleString("en-LK", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Specialization</p>
                      <p className="mt-1.5 font-semibold text-gray-900">{doctor.specialization || "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Verification Status</p>
                      <p className={`mt-1.5 font-semibold ${doctor.isVerified ? "text-emerald-700" : "text-amber-700"}`}>
                        {doctor.isVerified ? "Verified" : "Awaiting Verification"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">About</h2>
                  {doctor.bio ? (
                    <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{doctor.bio}</p>
                    </div>
                  ) : (
                    <div className="p-5 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
                      <p className="text-sm text-gray-500">
                        No biography added.{" "}
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-teal-600 hover:underline font-medium"
                        >
                          Add one now
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    Personal Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="d-name" className={LABEL_CLS}>Full Name</label>
                      <input
                        id="d-name" type="text" name="name"
                        value={formData.name || ""}
                        onChange={handleInputChange}
                        required
                        placeholder="Dr. John Smith"
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                    Professional Details
                  </h2>
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="d-spec" className={LABEL_CLS}>Specialization</label>
                        <input
                          id="d-spec" type="text" name="specialization"
                          value={formData.specialization || ""}
                          onChange={handleInputChange}
                          placeholder="e.g. Cardiology"
                          className={INPUT_CLS}
                        />
                      </div>
                      <div>
                        <label htmlFor="d-fee" className={LABEL_CLS}>Consultation Fee (LKR)</label>
                        <input
                          id="d-fee" type="number" min="0" step="0.01" name="consultationFee"
                          value={formData.consultationFee ?? ""}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          className={INPUT_CLS}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="d-qual" className={LABEL_CLS}>Qualification</label>
                      <input
                        id="d-qual" type="text" name="qualification"
                        value={formData.qualification || ""}
                        onChange={handleInputChange}
                        placeholder="e.g. MBBS, MD"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label htmlFor="d-bio" className={LABEL_CLS}>Biography</label>
                      <textarea
                        id="d-bio" name="bio" rows={5}
                        value={formData.bio || ""}
                        onChange={handleInputChange}
                        placeholder="Brief professional background, experience, and areas of expertise..."
                        className={INPUT_CLS}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors"
                  >
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page entry ───────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) return <ProfileSkeleton />;
  if (!user) return <ErrorState message="You need to sign in to view your profile." href="/login" label="Sign In" />;

  const role = getUserRole(user);
  if (role === "doctor") return <DoctorProfile />;
  if (role === "admin") return <ErrorState message="Admin accounts use the admin dashboard." href="/admin" label="Go to Admin Dashboard" />;
  return <PatientProfile />;
}
