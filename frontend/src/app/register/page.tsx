"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body: Record<string, unknown> = { name, email, password, role };
      if (role === "doctor" && specialization) {
        body.specialization = specialization;
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

      if (role === "doctor") {
        router.push("/dashboard");
      } else {
        router.push("/profile");
      }
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
        className="w-full max-w-md p-8"
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

          {/* Specialization (doctor only) — floating label */}
          {role === "doctor" && (
            <div>
              <div className="fl-group">
                <input
                  type="text"
                  id="reg-specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder=" "
                />
                <label htmlFor="reg-specialization">
                  Specialization
                </label>
              </div>
              <p
                className="text-xs mt-2 flex items-start gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mt-px flex-shrink-0"
                  style={{ color: "var(--accent)" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Your account will require admin verification before you can
                access the platform.
              </p>
            </div>
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
