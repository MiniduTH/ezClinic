"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ACCENT = "var(--brand)";
const ACCENT_SURFACE = "var(--brand-surface)";
const ACCENT_BORDER  = "var(--brand-border)";

export default function AdminLoginPage() {
  const router      = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Access denied"); return; }
      window.dispatchEvent(new Event("ezclinic:session-changed"));
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-surface)", position:"relative", overflow:"hidden", padding:24 }}>
      {/* Decorative blobs */}
      <div style={{ position:"fixed", top:"-15%", right:"-8%",  width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,121,107,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"fixed", bottom:"-15%", left:"-8%", width:440, height:440, borderRadius:"50%", background:"radial-gradient(circle,rgba(3,105,161,0.08) 0%,transparent 70%)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }} className="anim-fade-up">
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:64, height:64, borderRadius:18, background:ACCENT_SURFACE, border:`1px solid ${ACCENT_BORDER}`, marginBottom:20 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.75">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.5rem", fontWeight:800, color:"var(--text-primary)", marginBottom:8, letterSpacing:"-0.02em" }}>
            <span style={{ color:ACCENT }}>ez</span>Clinic Admin
          </div>
          <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", lineHeight:1.65 }}>
            Restricted access portal.<br/>Authorized personnel only.
          </p>
        </div>

        {/* Card */}
        <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:20, padding:36, boxShadow:"var(--shadow-md)" }}>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
            {/* Email */}
            <div>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:8 }}>Admin Email</label>
              <input
                type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                placeholder="admin@ezclinic.com"
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, background:"var(--bg-surface)", border:"1.5px solid var(--border)", color:"var(--text-primary)", fontSize:"0.875rem", outline:"none", boxSizing:"border-box", transition:"border-color 0.15s, box-shadow 0.15s" }}
                onFocus={e=>{e.target.style.borderColor=ACCENT;e.target.style.boxShadow=`0 0 0 3px ${ACCENT_SURFACE}`;}}
                onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";}}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:8 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input
                  type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                  placeholder="••••••••••"
                  style={{ width:"100%", padding:"12px 44px 12px 14px", borderRadius:10, background:"var(--bg-surface)", border:"1.5px solid var(--border)", color:"var(--text-primary)", fontSize:"0.875rem", outline:"none", boxSizing:"border-box", transition:"border-color 0.15s, box-shadow 0.15s" }}
                  onFocus={e=>{e.target.style.borderColor=ACCENT;e.target.style.boxShadow=`0 0 0 3px ${ACCENT_SURFACE}`;}}
                  onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none";}}
                />
                <button type="button" onClick={()=>setShowPw(v=>!v)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:4, display:"flex", alignItems:"center" }}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"var(--danger-surface)", border:"1px solid var(--danger-border)", color:"var(--danger)", fontSize:"0.8125rem", display:"flex", alignItems:"center", gap:8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-gradient"
              style={{ height:48, fontSize:"0.9375rem", fontWeight:700 }}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Authenticating…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security notice */}
        <div style={{ marginTop:16, padding:"12px 16px", borderRadius:12, background:"var(--bg-elevated)", border:"1px solid var(--border)", display:"flex", gap:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink:0, marginTop:2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", lineHeight:1.65, margin:0 }}>
            This page is for authorized administrators only. All access attempts are logged.
          </p>
        </div>

        <div style={{ textAlign:"center", marginTop:20 }}>
          <Link href="/"
            style={{ fontSize:"0.8125rem", color:"var(--text-muted)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, transition:"color 0.2s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-secondary)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-muted)";}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
