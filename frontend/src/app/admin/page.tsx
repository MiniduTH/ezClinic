"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  suspendedPatients: number;
  totalAdmins: number;
  newPatientsThisWeek: number;
  recentPatients: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }[];
}

function StatSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl" style={{ background: "var(--bg-muted)", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <div className="h-64 rounded-2xl" style={{ background: "var(--bg-muted)" }} />
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active: "badge badge-success",
  inactive: "badge badge-muted",
  suspended: "badge badge-danger",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Could not authenticate");
        const { accessToken } = await tokenRes.json();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1"}/admins/platform/stats`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) {
          if (response.status === 403) throw new Error("Forbidden: Admin access required.");
          throw new Error("Failed to fetch dashboard stats.");
        }
        setStats(await response.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const metricCards = stats
    ? [
        { label: "Total Patients", value: stats.totalPatients, hint: "All registered patients" },
        { label: "Active Patients", value: stats.activePatients, hint: "Currently active" },
        { label: "Suspended", value: stats.suspendedPatients, hint: "Locked accounts" },
        { label: "New This Week", value: stats.newPatientsThisWeek, hint: "Signups in last 7 days" },
        { label: "Admins", value: stats.totalAdmins, hint: "Platform administrators" },
      ]
    : [];

  return (
    <div className="max-w-[1100px] mx-auto flex flex-col gap-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform-wide statistics and recent activity.</p>
        </div>
        <span className="badge badge-brand">Admin</span>
      </div>

      {loading ? (
        <StatSkeleton />
      ) : error ? (
        <div
          className="glass-card-premium"
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--danger)",
            background: "var(--danger-surface)",
            borderColor: "var(--danger-border)",
          }}
        >
          {error}
        </div>
      ) : stats ? (
        <div className="flex flex-col gap-6">
          {/* Metrics */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
            {metricCards.map(({ label, value, hint }) => (
              <div key={label} className="stat-tile">
                <div className="stat-tile-label">{label}</div>
                <div className="stat-tile-value">{value}</div>
                <div className="stat-tile-hint">{hint}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {[
              { href: "/admin/patients", title: "Manage Patients", desc: "View, search, and update patient accounts" },
              { href: "/admin/doctors", title: "Doctor Verification", desc: "Review and approve / reject pending doctors" },
            ].map(({ href, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="glass-card-premium flex items-center justify-between gap-4 p-5 no-underline"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="icon-circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {href.includes("patients") ? (
                        <>
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </>
                      ) : (
                        <>
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </>
                      )}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[0.9375rem]" style={{ color: "var(--text-primary)" }}>{title}</p>
                    <p className="text-[0.8125rem] mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>
              </Link>
            ))}
          </div>

          {/* Recent patients */}
          <div className="glass-card-premium overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="section-heading">Recent Patients</h2>
              <Link href="/admin/patients" className="text-[0.8125rem] font-semibold no-underline" style={{ color: "var(--brand-text)" }}>
                View All →
              </Link>
            </div>
            {stats.recentPatients.length > 0 ? (
              <ul className="list-none m-0 p-0">
                {stats.recentPatients.map((patient, i) => (
                  <li
                    key={patient.id}
                    className="flex items-center justify-between px-6 py-3.5 transition-colors"
                    style={{ borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{patient.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{patient.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={STATUS_BADGE[patient.status] ?? STATUS_BADGE["active"]}>
                        {patient.status ?? "active"}
                      </span>
                      <Link href="/admin/patients" className="text-[0.8125rem] font-semibold no-underline" style={{ color: "var(--brand-text)" }}>
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="empty-state-title">No recent patients</div>
                <div className="empty-state-desc">New patient signups will appear here.</div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
