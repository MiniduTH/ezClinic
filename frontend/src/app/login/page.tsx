"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart, Stethoscope, ShieldCheck, Eye, EyeOff, ArrowLeft, LogIn } from "lucide-react";

// ── Role config ──────────────────────────────────────────
const ROLE_CONFIG = {
  patient: {
    label: "Patient",
    icon: <Heart size={18} strokeWidth={2} />,
    accent: "#00796B",
    accentLight: "#E0F2F1",
    gradient: "linear-gradient(160deg,#00796B 0%,#00897B 100%)",
    tagline: "Your health, your way.",
    description: "Access top doctors from home, manage prescriptions, and keep your health records in one secure place.",
    features: [
      "Connect with 800+ verified specialists",
      "Digital prescriptions & health records",
      "End-to-end encrypted consultations",
      "Transparent, upfront pricing",
    ],
  },
  doctor: {
    label: "Doctor",
    icon: <Stethoscope size={18} strokeWidth={2} />,
    accent: "#0369a1",
    accentLight: "#e0f2fe",
    gradient: "linear-gradient(160deg,#0369a1 0%,#0284c7 100%)",
    tagline: "Expand your practice online.",
    description: "Reach more patients, set your own schedule, and deliver quality care from anywhere.",
    features: [
      "Set your own availability & schedule",
      "Transparent consultation fee control",
      "Secure HD video consultations",
      "Digital prescriptions & records",
    ],
  },
  admin: {
    label: "Admin",
    icon: <ShieldCheck size={18} strokeWidth={2} />,
    accent: "#7c3aed",
    accentLight: "#ede9fe",
    gradient: "linear-gradient(160deg,#7c3aed 0%,#6d28d9 100%)",
    tagline: "Platform management.",
    description: "Monitor platform health, verify doctors, manage patients, and oversee all system operations.",
    features: [
      "Doctor verification & approval",
      "Patient account management",
      "Platform analytics & reports",
      "System configuration access",
    ],
  },
} as const;

type Role = keyof typeof ROLE_CONFIG;

// ═══════════════════════════════════════════════════════════
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-surface)" }}>
        <div style={{ width:32, height:32, borderRadius:"50%", border:"3px solid var(--border)", borderTopColor:"var(--brand)", animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════
function LoginContent() {
  const router      = useRouter();
  const params      = useSearchParams();
  const [role, setRole]         = useState<Role>("patient");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [panelKey, setPanelKey] = useState(0);

  useEffect(() => {
    const r = params.get("role");
    if (r === "patient" || r === "doctor" || r === "admin") setRole(r);
  }, [params]);

  const cfg = ROLE_CONFIG[role];

  function switchRole(r: Role) {
    if (r === role) return;
    setRole(r);
    setError("");
    setPanelKey(k => k + 1);
  }

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
      if (!res.ok) { setError(data.error || "Login failed. Please check your credentials."); return; }
      window.dispatchEvent(new Event("ezclinic:session-changed"));
      if (role === "doctor")      router.push("/dashboard");
      else if (role === "admin")  router.push("/admin");
      else                        router.push("/profile");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex" }}>
      {/* ── Left decorative panel ── */}
      <div
        key={panelKey}
        className="hidden-mobile anim-fade-in"
        style={{ flex:"0 0 420px", background:cfg.gradient, padding:"56px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }}
      >
        {/* Background circles */}
        <div style={{ position:"absolute", right:-60, top:-60, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", left:-40, bottom:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", right:40, bottom:120, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

        {/* Content */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"40px 0" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:999, background:"rgba(255,255,255,0.15)", color:"white", fontSize:"0.8125rem", fontWeight:600, marginBottom:24, width:"fit-content" }}>
            {cfg.icon} {cfg.label} Portal
          </div>
          <h2 style={{ fontSize:"2.25rem", fontWeight:800, color:"white", lineHeight:1.15, marginBottom:16, letterSpacing:"-0.02em" }}>
            {cfg.tagline}
          </h2>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.75)", lineHeight:1.75, marginBottom:36 }}>
            {cfg.description}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {cfg.features.map(f => (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:12, fontSize:"0.875rem", color:"rgba(255,255,255,0.82)" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.4)" }}>
          © 2026 ezClinic Digital Sanctuary
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", background:"var(--bg-surface)", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:420 }} className="anim-fade-up">

          {/* Logo + back link row */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36 }}>
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:9, textDecoration:"none" }}>
              <Image src="/ezClinicLogo.png" alt="ezClinic" width={32} height={32} style={{ objectFit:"contain" }} />
              <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.02em" }}>
                <span style={{ color:"var(--brand)" }}>ez</span><span style={{ color:"var(--text-primary)" }}>Clinic</span>
              </span>
            </Link>
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:"0.8125rem", color:"var(--text-muted)", textDecoration:"none", transition:"color 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-secondary)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-muted)";}}>
              <ArrowLeft size={13} /> Back
            </Link>
          </div>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:"1.875rem", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.025em", marginBottom:6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize:"0.9375rem", color:"var(--text-muted)" }}>Sign in to your ezClinic account.</p>
          </div>

          {/* Role selector */}
          <div style={{ display:"flex", gap:8, marginBottom:28, padding:5, borderRadius:14, background:"var(--bg-muted)", border:"1px solid var(--border)" }}>
            {(Object.keys(ROLE_CONFIG) as Role[]).map(r => (
              <button key={r} type="button" onClick={() => switchRole(r)}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 6px", borderRadius:10, border:"none", fontSize:"0.8125rem", fontWeight:600, cursor:"pointer", transition:"all 0.2s ease",
                  background: role === r ? ROLE_CONFIG[r].accent : "transparent",
                  color:      role === r ? "white"    : "var(--text-muted)",
                  boxShadow:  role === r ? `0 2px 8px ${ROLE_CONFIG[r].accent}35` : "none",
                }}>
                {ROLE_CONFIG[r].icon}
                {ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* Email */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)" }}>Email Address</label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@example.com"
                style={{ height:48, padding:"0 16px", borderRadius:12, border:"1.5px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-primary)", fontSize:"0.9375rem", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s", boxSizing:"border-box", width:"100%" }}
                onFocus={e=>{e.target.style.borderColor=cfg.accent;e.target.style.boxShadow=`0 0 0 3px ${cfg.accent}18`;}}
                onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";}}
              />
            </div>

            {/* Password */}
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <label style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)" }}>Password</label>
                <a href="#" style={{ fontSize:"0.8125rem", color:cfg.accent, textDecoration:"none", fontWeight:500 }}>Forgot password?</a>
              </div>
              <div style={{ position:"relative" }}>
                <input
                  type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••"
                  style={{ height:48, padding:"0 44px 0 16px", borderRadius:12, border:"1.5px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-primary)", fontSize:"0.9375rem", outline:"none", transition:"border-color 0.2s, box-shadow 0.2s", boxSizing:"border-box", width:"100%" }}
                  onFocus={e=>{e.target.style.borderColor=cfg.accent;e.target.style.boxShadow=`0 0 0 3px ${cfg.accent}18`;}}
                  onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";}}
                />
                <button type="button" onClick={()=>setShowPw(v=>!v)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:4, display:"flex", alignItems:"center" }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:10, background:"var(--danger-surface)", border:"1px solid var(--danger-border)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize:"0.8125rem", color:"var(--danger)", fontWeight:500 }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ height:50, borderRadius:12, background:cfg.accent, color:"white", fontWeight:700, fontSize:"0.9375rem", border:"none", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?0.8:1, transition:"opacity 0.2s, transform 0.15s", marginTop:4 }}
              onMouseEnter={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.opacity="0.92";}}
              onMouseLeave={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.opacity="1";}}
              onMouseDown={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.transform="scale(0.97)";}}
              onMouseUp={e=>{(e.currentTarget as HTMLButtonElement).style.transform="scale(1)";}}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Signing in…
                </>
              ) : (
                <><LogIn size={17} /> Sign In as {cfg.label}</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"24px 0" }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
            <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontWeight:500 }}>New to ezClinic?</span>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
          </div>

          {/* Register links */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Link href="/register/patient"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px 0", borderRadius:12, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", color:"var(--text-secondary)", fontSize:"0.8125rem", fontWeight:600, textDecoration:"none", transition:"all 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="#00796B";(e.currentTarget as HTMLAnchorElement).style.color="#00796B";(e.currentTarget as HTMLAnchorElement).style.background="var(--brand-surface)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--border)";(e.currentTarget as HTMLAnchorElement).style.color="var(--text-secondary)";(e.currentTarget as HTMLAnchorElement).style.background="var(--bg-elevated)";}}>
              <Heart size={14} /> Patient Sign Up
            </Link>
            <Link href="/register/doctor"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px 0", borderRadius:12, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", color:"var(--text-secondary)", fontSize:"0.8125rem", fontWeight:600, textDecoration:"none", transition:"all 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="#0369a1";(e.currentTarget as HTMLAnchorElement).style.color="#0369a1";(e.currentTarget as HTMLAnchorElement).style.background="#e0f2fe";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--border)";(e.currentTarget as HTMLAnchorElement).style.color="var(--text-secondary)";(e.currentTarget as HTMLAnchorElement).style.background="var(--bg-elevated)";}}>
              <Stethoscope size={14} /> Doctor Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
