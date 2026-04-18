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
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:20 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ borderRadius:16, background:"var(--bg-muted)", height:112, animation:"pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <div style={{ borderRadius:16, background:"var(--bg-muted)", height:256 }} />
    </div>
  );
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active:    { bg:"var(--success-surface)", color:"var(--success-text)" },
  inactive:  { bg:"var(--bg-muted)",        color:"var(--text-secondary)" },
  suspended: { bg:"var(--danger-surface)",  color:"var(--danger-text)" },
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

  const metricCards = stats ? [
    { label:"Total Patients",    value:stats.totalPatients,       color:"var(--brand)",   bg:"var(--brand-surface)" },
    { label:"Active Patients",   value:stats.activePatients,      color:"var(--success)", bg:"var(--success-surface)" },
    { label:"Suspended",         value:stats.suspendedPatients,   color:"var(--danger)",  bg:"var(--danger-surface)" },
    { label:"New This Week",     value:stats.newPatientsThisWeek, color:"#0369a1",        bg:"#e0f2fe" },
    { label:"Admins",            value:stats.totalAdmins,         color:"var(--text-secondary)", bg:"var(--bg-muted)" },
  ] : [];

  return (
    <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 24px", display:"flex", flexDirection:"column", gap:32 }}>
      <div>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em", marginBottom:4 }}>Admin Dashboard</h1>
        <p style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>Platform-wide statistics and recent activity.</p>
      </div>

      {loading ? (
        <StatSkeleton />
      ) : error ? (
        <div style={{ padding:32, textAlign:"center", color:"var(--danger)", background:"var(--danger-surface)", borderRadius:16, border:"1px solid var(--danger-border)" }}>
          {error}
        </div>
      ) : stats ? (
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          {/* Metrics */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))", gap:16 }}>
            {metricCards.map(({ label, value, color, bg }) => (
              <div key={label} style={{ borderRadius:16, background:"var(--bg-elevated)", border:"1px solid var(--border)", padding:"20px 24px", boxShadow:"var(--shadow-sm)" }}>
                <p style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
                <p style={{ fontSize:"2.5rem", fontWeight:800, color, lineHeight:1 }}>{value}</p>
                <div style={{ marginTop:12, height:3, borderRadius:2, background:bg }} />
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[
              { href:"/admin/patients", title:"Manage Patients",       desc:"View, search, and update patient accounts" },
              { href:"/admin/doctors",  title:"Doctor Verification",   desc:"Review and approve / reject pending doctors" },
            ].map(({ href, title, desc }) => (
              <Link key={href} href={href}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:16, border:"1px solid var(--border)", background:"var(--bg-elevated)", padding:20, textDecoration:"none", boxShadow:"var(--shadow-sm)", transition:"border-color 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--brand)";(e.currentTarget as HTMLAnchorElement).style.boxShadow="var(--shadow-brand)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--border)";(e.currentTarget as HTMLAnchorElement).style.boxShadow="var(--shadow-sm)";}}>
                <div>
                  <p style={{ fontWeight:600, fontSize:"0.9375rem", color:"var(--text-primary)", marginBottom:4 }}>{title}</p>
                  <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>{desc}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M9 5l7 7-7 7"/></svg>
              </Link>
            ))}
          </div>

          {/* Recent patients */}
          <div style={{ borderRadius:16, background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:"1px solid var(--border)" }}>
              <h2 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-primary)" }}>Recent Patients</h2>
              <Link href="/admin/patients" style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--brand-text)", textDecoration:"none" }}>
                View All →
              </Link>
            </div>
            {stats.recentPatients.length > 0 ? (
              <ul style={{ listStyle:"none", margin:0, padding:0 }}>
                {stats.recentPatients.map((patient, i) => (
                  <li key={patient.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 24px", borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none", transition:"background-color 0.15s" }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLLIElement).style.background="var(--bg-surface)";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLLIElement).style.background="transparent";}}>
                    <div>
                      <p style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)", marginBottom:2 }}>{patient.name}</p>
                      <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{patient.email}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <span style={{
                        background:(STATUS_COLORS[patient.status] ?? STATUS_COLORS["active"]).bg,
                        color:(STATUS_COLORS[patient.status] ?? STATUS_COLORS["active"]).color,
                        fontSize:"0.6875rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em",
                        padding:"3px 10px", borderRadius:999,
                      }}>
                        {patient.status ?? "active"}
                      </span>
                      <Link href="/admin/patients" style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--brand-text)", textDecoration:"none" }}>
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ padding:"32px 24px", fontSize:"0.875rem", color:"var(--text-muted)" }}>No recent patients found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
