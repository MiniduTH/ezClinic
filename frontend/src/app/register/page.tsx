"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [specializationOption, setSpecializationOption] = useState<string>("");
  const [customSpecialization, setCustomSpecialization] = useState<string>("");
  const [qualification, setQualification] = useState("");
  const [bio, setBio] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const invalid = selected.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid) {
      setError("Documents must be PDF, JPEG, or PNG and under 5 MB each.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const merged = [...files, ...selected].slice(0, MAX_FILES);
    setFiles(merged);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = { name, email, password, role };
      if (role === "doctor") {
        const finalSpecialization = specializationOption === "other" ? (customSpecialization || "") : specializationOption || specialization;
        if (finalSpecialization) body.specialization = finalSpecialization;
        if (qualification) body.qualification = qualification;
        if (bio) body.bio = bio;
        if (consultationFee) body.consultationFee = Number(consultationFee);
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Upload credential documents if any
      if (role === "doctor" && files.length > 0) {
        try {
          const tokenRes = await fetch("/api/auth/token");
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.accessToken;
          if (accessToken) {
            const formData = new FormData();
            files.forEach((f) => formData.append("files", f));
            await fetch(`${DOCTOR_API}/doctors/me/credentials`, {
              method: "POST",
              headers: { Authorization: `Bearer ${accessToken}` },
              body: formData,
            });
          }
        } catch {
          // Non-fatal: registration succeeded; docs can be uploaded from profile
        }
      }

      router.push(role === "doctor" ? "/dashboard" : "/profile");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const roles: Array<{ value: "patient" | "doctor"; label: string }> = [
    { value: "patient", label: "Patient" },
    { value: "doctor", label: "Doctor" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-surface)" }}
    >
      <div
        className="w-full max-w-md p-8 overflow-y-auto max-h-[90vh]"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline gap-0.5 mb-3">
            <span
              className="text-3xl font-bold"
              style={{
                color: "var(--brand)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              ez
            </span>
            <span
              className="text-3xl font-bold"
              style={{
                color: "var(--text-primary)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Clinic
            </span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Create your account
          </p>
        </div>

        {/* Role segmented control */}
        <div
          className="flex mb-6 p-1 gap-1"
          style={{
            background: "var(--bg-muted)",
            borderRadius: "10px",
          }}
        >
          {roles.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRole(value)}
              className="flex-1 py-2 text-sm font-medium transition-colors"
              style={{
                borderRadius: "8px",
                background: role === value ? "var(--brand)" : "transparent",
                color: role === value ? "#ffffff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name — floating label */}
          <div className="fl-group">
            <input
              type="text"
              id="reg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder=" "
            />
            <label htmlFor="reg-name">Full Name</label>
          </div>

          {/* Email — floating label */}
          <div className="fl-group">
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder=" "
            />
            <label htmlFor="reg-email">Email Address</label>
          </div>

          {/* Password — floating label */}
          <div className="fl-group">
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              placeholder=" "
            />
            <label htmlFor="reg-password">Password</label>
          </div>

          {/* Doctor-only fields */}
          {role === "doctor" && (
            <>
              {/* Specialization (predefined list) */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Specialization
                </label>
                <select
                  value={specializationOption || specialization}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSpecializationOption(v);
                    if (v !== "other") setCustomSpecialization("");
                  }}
                  style={{
                    width: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.875rem",
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                >
                  <option value="">Select a specialization…</option>
                  <option value="General Practice">General Practice</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="ENT">ENT</option>
                  <option value="Psychiatry">Psychiatry</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Anesthesiology">Anesthesiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Nephrology">Nephrology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Urology">Urology</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Surgery">Surgery</option>
                  <option value="other">Other (specify)</option>
                </select>

                {specializationOption === "other" && (
                  <div className="mt-2">
                    <input
                      type="text"
                      id="reg-specialization-custom"
                      value={customSpecialization}
                      onChange={(e) => setCustomSpecialization(e.target.value)}
                      placeholder="Enter specialization"
                      style={{
                        width: "100%",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "0.875rem",
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--text-primary)",
                        outline: "none",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Qualification */}
              <div className="fl-group">
                <input
                  type="text"
                  id="reg-qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="reg-qualification">
                  Qualifications (e.g. MBBS, MD)
                </label>
              </div>

              {/* Consultation Fee */}
              <div className="fl-group">
                <input
                  type="number"
                  id="reg-fee"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  placeholder=" "
                  min="0"
                  step="0.01"
                />
                <label htmlFor="reg-fee">Consultation Fee (LKR)</label>
              </div>

              {/* Bio */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Short Bio (optional)
                </label>
                <textarea
                  id="reg-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Brief professional summary…"
                  style={{
                    width: "100%",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.875rem",
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              {/* Credential Documents */}
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Credential Documents
                  <span className="ml-1 font-normal" style={{ color: "var(--text-muted)" }}>
                    (medical license, degree certificate — PDF/JPEG/PNG, max 5 files, 5 MB each)
                  </span>
                </label>

                {/* Drop zone / file button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                  className="w-full flex flex-col items-center justify-center gap-1 py-4 rounded-lg border-2 border-dashed text-sm transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--bg-muted)",
                    color: "var(--text-muted)",
                    cursor: files.length >= MAX_FILES ? "not-allowed" : "pointer",
                    opacity: files.length >= MAX_FILES ? 0.5 : 1,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  {files.length >= MAX_FILES ? "Max 5 files reached" : "Click to upload documents"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* File list */}
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between text-xs rounded-lg px-3 py-2"
                        style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                      >
                        <span className="truncate mr-2">📎 {f.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="shrink-0 text-sm leading-none"
                          style={{ color: "var(--danger-text)" }}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Verification notice */}
              <p
                className="text-xs flex items-start gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" className="mt-px flex-shrink-0"
                  style={{ color: "var(--accent)" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Your account will require admin verification before you can access the platform.
              </p>
            </>
          )}

          {/* Error message */}
          {error && (
            <div
              className="text-sm px-4 py-3 rounded-lg"
              style={{
                background: "var(--danger-surface)",
                border: "1px solid var(--danger)",
                color: "var(--danger-text)",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            style={{
              background: loading ? "var(--brand-hover)" : "var(--brand)",
              color: "#ffffff",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
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
                Creating account…
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium hover:underline"
            style={{ color: "var(--brand-text)" }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
