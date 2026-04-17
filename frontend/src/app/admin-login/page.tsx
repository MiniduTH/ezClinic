"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div style={{ minHeight:"100vh", display:"flex", background:"#0f172a", position:"relative", overflow:"hidden" }}>
      {/* Background glows */}
      <div style={{ position:"absolute", top:"-20%", left:"-10%",  width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(15,110,86,0.12) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-20%", right:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(3,105,161,0.1) 0%,transparent 70%)",  pointerEvents:"none" }} />

      {/* Grid pattern overlay */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:1 }}>
        <div style={{ width:"100%", maxWidth:420 }} className="anim-fade-up">
          {/* Header */}
          <div style={{ textAlign:"center", marginBottom:40 }}>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:64, height:64, borderRadius:18, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", marginBottom:20 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.75">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div style={{ fontFamily:"ui-monospace,monospace", fontSize:"1.5rem", fontWeight:700, color:"white", marginBottom:8 }}>
              <span style={{ color:"#34d399" }}>ez</span>Clinic Admin
            </div>
            <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.4)", lineHeight:1.65 }}>Restricted access portal.<br/>Authorized personnel only.</p>
          </div>

          {/* Card */}
          <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:20, padding:36 }}>
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>
              {/* Email */}
              <div>
                <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:500, color:"rgba(255,255,255,0.55)", marginBottom:8 }}>Admin Email</label>
                <input
                  type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"
                  placeholder="admin@ezclinic.com"
                  style={{ width:"100%", padding:"12px 14px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }}
                  onFocus={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(52,211,153,0.4)";(e.target as HTMLInputElement).style.boxShadow="0 0 0 3px rgba(52,211,153,0.08)";}}
                  onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.1)";(e.target as HTMLInputElement).style.boxShadow="none";}}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:500, color:"rgba(255,255,255,0.55)", marginBottom:8 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <input
                    type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"
                    placeholder="••••••••••"
                    style={{ width:"100%", padding:"12px 44px 12px 14px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"white", fontSize:"0.875rem", outline:"none", boxSizing:"border-box" }}
                    onFocus={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(52,211,153,0.4)";(e.target as HTMLInputElement).style.boxShadow="0 0 0 3px rgba(52,211,153,0.08)";}}
                    onBlur={e=>{(e.target as HTMLInputElement).style.borderColor="rgba(255,255,255,0.1)";(e.target as HTMLInputElement).style.boxShadow="none";}}
                  />
                  <button type="button" onClick={()=>setShowPw(v=>!v)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.35)", padding:4 }}>
                    {showPw ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ padding:"10px 14px", borderRadius:10, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5", fontSize:"0.8125rem", display:"flex", alignItems:"center", gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ height:48, borderRadius:12, background:loading?"rgba(52,211,153,0.6)":"#34d399", color:"#022c22", fontWeight:700, fontSize:"0.9375rem", border:"none", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"opacity 0.2s,background-color 0.2s" }}>
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
          <div style={{ marginTop:20, padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" style={{ flexShrink:0, marginTop:2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.28)", lineHeight:1.65, margin:0 }}>
              This page is for authorized administrators only. All access attempts are logged.
            </p>
          </div>

          <div style={{ textAlign:"center", marginTop:20 }}>
            <Link href="/" style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.3)", textDecoration:"none", display:"inline-flex", alignItems:"center", gap:6, transition:"color 0.2s" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.6)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.3)";}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
