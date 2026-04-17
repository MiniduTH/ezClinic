"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-surface)" }}
          role="status"
          aria-label="Loading login page"
        >
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Loading…
          </span>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initialRole = searchParams.get("role");
    if (
      initialRole === "patient" ||
      initialRole === "doctor" ||
      initialRole === "admin"
    ) {
      setRole(initialRole);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      window.dispatchEvent(new Event("ezclinic:session-changed"));

      if (role === "doctor") {
        router.push("/dashboard");
      } else if (role === "admin") {
        router.push("/admin");
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

  const roles: Array<{ value: "patient" | "doctor" | "admin"; label: string }> =
    [
      { value: "patient", label: "Patient" },
      { value: "doctor", label: "Doctor" },
      { value: "admin", label: "Admin" },
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
            Sign in to your account
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
                background:
                  role === value ? "var(--brand)" : "transparent",
                color:
                  role === value ? "#ffffff" : "var(--text-secondary)",
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
          {/* Email — floating label */}
          <div className="fl-group">
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder=" "
            />
            <label htmlFor="login-email">Email Address</label>
          </div>

          {/* Password — floating label */}
          <div className="fl-group">
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder=" "
            />
            <label htmlFor="login-password">Password</label>
          </div>

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
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Footer link */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "var(--text-muted)" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium hover:underline"
            style={{ color: "var(--brand-text)" }}
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
