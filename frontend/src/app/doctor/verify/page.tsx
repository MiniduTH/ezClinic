"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

/* ─── Types ──────────────────────────────────────────────────── */

interface SessionData {
  user?: {
    name?: string;
    role?: string;
  };
}

type UploadSlot =
  | "degreeCertificate"
  | "councilRegistration"
  | "nationalId";

interface FileEntry {
  file: File;
  error?: string;
}

interface Step1Fields {
  fullName: string;
  specialization: string;
  qualification: string;
  experience: string;
  fee: string;
  bio: string;
}

/* ─── Helpers ────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function validateFile(file: File): string | undefined {
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return "Only PDF or image files (JPG, PNG, WEBP) are accepted.";
  if (file.size > 5 * 1024 * 1024)
    return "File size must not exceed 5 MB.";
  return undefined;
}

/* ─── Sub-components ─────────────────────────────────────────── */

interface StepIndicatorProps {
  current: number;
}

function StepIndicator({ current }: StepIndicatorProps) {
  const steps = [
    { n: 1, label: "Personal Details" },
    { n: 2, label: "Upload Documents" },
    { n: 3, label: "Review & Submit" },
  ];

  return (
    <div className="flex items-center justify-center mb-8 gap-0">
      {steps.map(({ n, label }, idx) => {
        const done = n < current;
        const active = n === current;

        return (
          <div key={n} className="flex items-center">
            {/* connector line */}
            {idx > 0 && (
              <div
                className="h-px w-12 sm:w-20 flex-shrink-0 transition-colors"
                style={{
                  background: done || active ? "var(--brand)" : "var(--border)",
                }}
              />
            )}

            {/* circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors"
                style={{
                  background:
                    done || active ? "var(--brand)" : "var(--bg-muted)",
                  color:
                    done || active ? "#ffffff" : "var(--text-muted)",
                  border:
                    active
                      ? "2px solid var(--brand)"
                      : "2px solid transparent",
                }}
              >
                {done ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap hidden sm:block"
                style={{
                  color: active ? "var(--brand-text)" : "var(--text-muted)",
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DropZoneProps {
  label: string;
  required?: boolean;
  file: FileEntry | null;
  onFile: (entry: FileEntry | null) => void;
}

function DropZone({ label, required, file, onFile }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validateFile(f);
    onFile({ file: f, error: err });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const borderColor = file?.error
    ? "var(--danger)"
    : dragging
    ? "var(--brand)"
    : "var(--border)";

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
        {required && (
          <span className="ml-1" style={{ color: "var(--danger)" }}>
            *
          </span>
        )}
      </p>

      {file && !file.error ? (
        /* Selected file chip */
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg"
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border, var(--brand))",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="flex-shrink-0"
              style={{ color: "var(--brand)" }}
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--brand-text)" }}
              >
                {file.file.name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {formatFileSize(file.file.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onFile(null)}
            className="ml-3 flex-shrink-0 rounded-full p-0.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Remove file"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-lg cursor-pointer transition-colors"
          style={{
            border: `1.5px dashed ${borderColor}`,
            background: dragging ? "var(--brand-surface)" : "var(--bg-surface)",
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ color: "var(--text-muted)" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Drop file here or{" "}
            <span
              className="font-medium"
              style={{ color: "var(--brand-text)" }}
            >
              click to browse
            </span>
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            PDF or image · max 5 MB
          </p>
        </div>
      )}

      {file?.error && (
        <p className="text-xs" style={{ color: "var(--danger-text)" }}>
          {file.error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

interface MultiDropZoneProps {
  label: string;
  files: FileEntry[];
  onFiles: (entries: FileEntry[]) => void;
  maxFiles?: number;
}

function MultiDropZone({
  label,
  files,
  onFiles,
  maxFiles = 3,
}: MultiDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleAdd = (fl: FileList | null) => {
    if (!fl) return;
    const incoming = Array.from(fl)
      .slice(0, maxFiles - files.length)
      .map((f) => ({ file: f, error: validateFile(f) }));
    onFiles([...files, ...incoming]);
  };

  const handleRemove = (idx: number) => {
    onFiles(files.filter((_, i) => i !== idx));
  };

  const canAdd = files.length < maxFiles;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}{" "}
        <span className="font-normal" style={{ color: "var(--text-muted)" }}>
          (optional, up to {maxFiles})
        </span>
      </p>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fe, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{
                background: fe.error
                  ? "var(--danger-surface)"
                  : "var(--brand-surface)",
                border: `1px solid ${fe.error ? "var(--danger)" : "var(--brand-border, var(--brand))"}`,
              }}
            >
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{
                    color: fe.error ? "var(--danger-text)" : "var(--brand-text)",
                  }}
                >
                  {fe.file.name}
                </p>
                {fe.error ? (
                  <p className="text-xs" style={{ color: "var(--danger-text)" }}>
                    {fe.error}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatFileSize(fe.file.size)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="ml-3 flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
                aria-label="Remove file"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-6 rounded-lg cursor-pointer transition-colors"
          style={{
            border: `1.5px dashed ${dragging ? "var(--brand)" : "var(--border)"}`,
            background: dragging ? "var(--brand-surface)" : "var(--bg-surface)",
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleAdd(e.dataTransfer.files); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--text-muted)" }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Add file{" "}
            <span style={{ color: "var(--brand-text)", fontWeight: 500 }}>
              ({files.length}/{maxFiles})
            </span>
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleAdd(e.target.files)}
      />
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────── */

export default function DoctorVerifyPage() {
  const router = useRouter();

  /* Session check */
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: SessionData) => {
        if (!data?.user || data.user.role !== "doctor") {
          router.replace("/login");
          return;
        }
        setSessionName(data.user.name ?? "");
        setSessionLoading(false);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  /* Wizard state */
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  /* Step 1 fields */
  const [fields, setFields] = useState<Step1Fields>({
    fullName: "",
    specialization: "",
    qualification: "",
    experience: "",
    fee: "",
    bio: "",
  });
  const [step1Errors, setStep1Errors] = useState<Partial<Step1Fields>>({});

  /* Sync session name once loaded */
  useEffect(() => {
    if (sessionName) {
      setFields((prev) => ({ ...prev, fullName: sessionName }));
    }
  }, [sessionName]);

  /* Step 2 files */
  const [degreeCertificate, setDegreeCertificate] = useState<FileEntry | null>(
    null
  );
  const [councilRegistration, setCouncilRegistration] =
    useState<FileEntry | null>(null);
  const [nationalId, setNationalId] = useState<FileEntry | null>(null);
  const [additionalCerts, setAdditionalCerts] = useState<FileEntry[]>([]);
  const [step2Error, setStep2Error] = useState("");

  /* Step 3 */
  const [confirmed, setConfirmed] = useState(false);

  /* ── Helpers ── */

  const setField = (key: keyof Step1Fields, val: string) => {
    setFields((prev) => ({ ...prev, [key]: val }));
    setStep1Errors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = (): boolean => {
    const errs: Partial<Step1Fields> = {};
    if (!fields.fullName.trim()) errs.fullName = "Required";
    if (!fields.specialization) errs.specialization = "Required";
    if (!fields.qualification.trim()) errs.qualification = "Required";
    if (fields.experience === "" || Number(fields.experience) < 0)
      errs.experience = "Required (min 0)";
    if (fields.fee === "" || Number(fields.fee) < 0)
      errs.fee = "Required (min 0)";
    setStep1Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const missing: string[] = [];
    if (!degreeCertificate || degreeCertificate.error)
      missing.push("Medical degree certificate");
    if (!councilRegistration || councilRegistration.error)
      missing.push("Medical council registration");
    if (!nationalId || nationalId.error) missing.push("National ID or passport");
    const hasAdditionalErrors = additionalCerts.some((f) => f.error);
    if (hasAdditionalErrors) missing.push("Fix errors in additional certificates");

    if (missing.length) {
      setStep2Error(missing.join(" · "));
      return false;
    }
    setStep2Error("");
    return true;
  };

  const handleStep1Continue = () => {
    if (validateStep1()) setCurrentStep(2);
  };

  const handleStep2Continue = () => {
    if (validateStep2()) setCurrentStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      /* Get token */
      const tokenRes = await fetch("/api/auth/token");
      const { token } = await tokenRes.json();

      const formData = new FormData();
      formData.append("fullName", fields.fullName);
      formData.append("specialization", fields.specialization);
      formData.append("qualification", fields.qualification);
      formData.append("experience", fields.experience);
      formData.append("fee", fields.fee);
      formData.append("bio", fields.bio);
      if (degreeCertificate) formData.append("degreeCertificate", degreeCertificate.file);
      if (councilRegistration) formData.append("councilRegistration", councilRegistration.file);
      if (nationalId) formData.append("nationalId", nationalId.file);
      additionalCerts.forEach((fe) => {
        if (!fe.error) formData.append("additionalCerts", fe.file);
      });

      const res = await fetch(`${DOCTOR_API}/doctors/credentials`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSubmitError(err.message || "Submission failed. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading state ── */

  if (sessionLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-surface)" }}
      >
        <svg
          className="animate-spin"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: "var(--brand)" }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  /* ── Success state ── */

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ background: "var(--bg-surface)" }}
      >
        <div
          className="w-full max-w-md p-10 text-center"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          {/* Checkmark circle */}
          <div
            className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "var(--brand-surface)" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ color: "var(--brand)" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Application Submitted
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
            Your application is under review.
          </p>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Estimated review time: <strong>2–3 business days</strong>
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full h-11 font-medium text-sm transition-colors"
            style={{
              background: "var(--brand)",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Main wizard ── */

  const specializations = [
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Psychiatry",
    "Oncology",
    "Other",
  ];

  return (
    <div
      className="min-h-screen flex items-start justify-center px-4 py-12"
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-2">
            <span
              className="text-2xl font-bold"
              style={{
                color: "var(--brand)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              ez
            </span>
            <span
              className="text-2xl font-bold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Clinic
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Doctor Credential Verification
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={currentStep} />

        {/* Card */}
        <div
          className="p-6 sm:p-8"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            minHeight: "400px",
          }}
        >
          {/* ── STEP 1 ── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Personal Details
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Tell us about your professional background.
                </p>
              </div>

              {/* Full Name */}
              <div className={`fl-group${fields.fullName ? " filled" : ""}${step1Errors.fullName ? " error" : ""}`}>
                <input
                  type="text"
                  id="v-fullname"
                  value={fields.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder=" "
                  readOnly={!!sessionName}
                  style={sessionName ? { opacity: 0.75 } : undefined}
                />
                <label htmlFor="v-fullname">Full Name</label>
              </div>
              {step1Errors.fullName && (
                <p className="text-xs -mt-3" style={{ color: "var(--danger-text)" }}>
                  {step1Errors.fullName}
                </p>
              )}

              {/* Specialization */}
              <div className={`fl-group${fields.specialization ? " filled" : ""}${step1Errors.specialization ? " error" : ""}`}>
                <select
                  id="v-spec"
                  value={fields.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                >
                  <option value="" disabled />
                  {specializations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <label htmlFor="v-spec">Specialization</label>
              </div>
              {step1Errors.specialization && (
                <p className="text-xs -mt-3" style={{ color: "var(--danger-text)" }}>
                  {step1Errors.specialization}
                </p>
              )}

              {/* Qualification */}
              <div className={`fl-group${fields.qualification ? " filled" : ""}${step1Errors.qualification ? " error" : ""}`}>
                <input
                  type="text"
                  id="v-qual"
                  value={fields.qualification}
                  onChange={(e) => setField("qualification", e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="v-qual">Qualification (e.g. MBBS, MD)</label>
              </div>
              {step1Errors.qualification && (
                <p className="text-xs -mt-3" style={{ color: "var(--danger-text)" }}>
                  {step1Errors.qualification}
                </p>
              )}

              {/* Experience + Fee — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`fl-group${fields.experience !== "" ? " filled" : ""}${step1Errors.experience ? " error" : ""}`}>
                    <input
                      type="number"
                      id="v-exp"
                      value={fields.experience}
                      onChange={(e) => setField("experience", e.target.value)}
                      min={0}
                      placeholder=" "
                    />
                    <label htmlFor="v-exp">Years of Experience</label>
                  </div>
                  {step1Errors.experience && (
                    <p className="text-xs mt-1" style={{ color: "var(--danger-text)" }}>
                      {step1Errors.experience}
                    </p>
                  )}
                </div>
                <div>
                  <div className={`fl-group${fields.fee !== "" ? " filled" : ""}${step1Errors.fee ? " error" : ""}`}>
                    <input
                      type="number"
                      id="v-fee"
                      value={fields.fee}
                      onChange={(e) => setField("fee", e.target.value)}
                      min={0}
                      placeholder=" "
                    />
                    <label htmlFor="v-fee">Consultation Fee (LKR)</label>
                  </div>
                  {step1Errors.fee && (
                    <p className="text-xs mt-1" style={{ color: "var(--danger-text)" }}>
                      {step1Errors.fee}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <div className={`fl-group${fields.bio ? " filled" : ""}`}>
                  <textarea
                    id="v-bio"
                    value={fields.bio}
                    onChange={(e) =>
                      setField("bio", e.target.value.slice(0, 300))
                    }
                    rows={4}
                    placeholder=" "
                  />
                  <label htmlFor="v-bio">Short Bio</label>
                </div>
                <p
                  className="text-xs mt-1 text-right"
                  style={{ color: "var(--text-muted)" }}
                >
                  {fields.bio.length} / 300 characters
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  className="h-10 px-6 text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{
                    background: "var(--brand)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Continue
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Upload Documents
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Upload clear copies of your credentials.
                </p>
              </div>

              <DropZone
                label="Medical Degree Certificate"
                required
                file={degreeCertificate}
                onFile={setDegreeCertificate}
              />
              <DropZone
                label="Medical Council Registration"
                required
                file={councilRegistration}
                onFile={setCouncilRegistration}
              />
              <DropZone
                label="National ID or Passport"
                required
                file={nationalId}
                onFile={setNationalId}
              />
              <MultiDropZone
                label="Additional Certificates"
                files={additionalCerts}
                onFiles={setAdditionalCerts}
                maxFiles={3}
              />

              {step2Error && (
                <div
                  className="text-sm px-4 py-3 rounded-lg"
                  style={{
                    background: "var(--danger-surface)",
                    border: "1px solid var(--danger)",
                    color: "var(--danger-text)",
                  }}
                >
                  {step2Error}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-10 px-5 text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{
                    background: "var(--bg-muted)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Continue}
                  className="h-10 px-6 text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{
                    background: "var(--brand)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Continue
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Review &amp; Submit
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Confirm your details before submitting.
                </p>
              </div>

              {/* Personal details summary */}
              <div
                className="rounded-lg p-5"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Personal Details
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    { label: "Full Name", value: fields.fullName },
                    { label: "Specialization", value: fields.specialization },
                    { label: "Qualification", value: fields.qualification },
                    {
                      label: "Experience",
                      value: `${fields.experience} years`,
                    },
                    {
                      label: "Consultation Fee",
                      value: `LKR ${fields.fee}`,
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-sm font-medium mt-0.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                  {fields.bio && (
                    <div className="col-span-2">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Bio
                      </p>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {fields.bio}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents summary */}
              <div
                className="rounded-lg p-5"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Documents
                </p>
                <ul className="space-y-2">
                  {(
                    [
                      { key: "degreeCertificate" as UploadSlot, label: "Medical Degree Certificate", file: degreeCertificate },
                      { key: "councilRegistration" as UploadSlot, label: "Medical Council Registration", file: councilRegistration },
                      { key: "nationalId" as UploadSlot, label: "National ID / Passport", file: nationalId },
                    ] as Array<{ key: UploadSlot; label: string; file: FileEntry | null }>
                  ).map(({ label, file }) => (
                    <li key={label} className="flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ color: "var(--brand)", flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {label}:{" "}
                        <span style={{ color: "var(--text-primary)" }}>
                          {file?.file.name ?? "—"}
                        </span>
                      </span>
                    </li>
                  ))}
                  {additionalCerts
                    .filter((fe) => !fe.error)
                    .map((fe, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{ color: "var(--brand)", flexShrink: 0 }}
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Additional certificate:{" "}
                          <span style={{ color: "var(--text-primary)" }}>
                            {fe.file.name}
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              {/* Confirmation checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer"
                  style={{ accentColor: "var(--brand)" }}
                />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  I confirm that all information provided is accurate and
                  complete, and I authorise ezClinic to verify my credentials
                  with the relevant authorities.
                </span>
              </label>

              {/* Submit error */}
              {submitError && (
                <div
                  className="text-sm px-4 py-3 rounded-lg"
                  style={{
                    background: "var(--danger-surface)",
                    border: "1px solid var(--danger)",
                    color: "var(--danger-text)",
                  }}
                >
                  {submitError}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="h-10 px-5 text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{
                    background: "var(--bg-muted)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!confirmed || submitting}
                  className="h-10 px-6 text-sm font-medium flex items-center gap-2 transition-colors"
                  style={{
                    background:
                      !confirmed || submitting
                        ? "var(--bg-muted)"
                        : "var(--brand)",
                    color:
                      !confirmed || submitting
                        ? "var(--text-muted)"
                        : "#ffffff",
                    borderRadius: "8px",
                    border: "none",
                    cursor:
                      !confirmed || submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
