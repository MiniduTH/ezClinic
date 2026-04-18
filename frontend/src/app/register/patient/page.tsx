"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Stethoscope, ClipboardList, ShieldCheck, CreditCard } from "lucide-react";

export default function PatientRegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPw) { setError("Passwords do not match."); return; }
    if (password.length < 8)   { setError("Password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "patient" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      window.dispatchEvent(new Event("ezclinic:session-changed"));
      router.push("/profile");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-surface)" }}>
      {/* Left panel */}
      <div style={{ flex:"0 0 420px", background:"linear-gradient(160deg,#00796B 0%,#00897B 100%)", padding:"60px 48px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }} className="hidden-mobile">
        <div style={{ position:"absolute", right:-60, top:-60, width:280, height:280, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", left:-40, bottom:-60, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div>
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:60 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={36} height={36} style={{ objectFit:"contain", filter:"brightness(0) invert(1)" }} />
            <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.2rem", fontWeight:800, color:"white", letterSpacing:"-0.02em" }}>ezClinic</span>
          </Link>
          <h2 style={{ fontSize:"2rem", fontWeight:800, color:"white", marginBottom:16, lineHeight:1.2 }}>Your health, your way.</h2>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.75)", lineHeight:1.75 }}>Access top doctors from home, manage prescriptions, and keep your health records in one place.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { icon:<Stethoscope size={15} />, text:"Connect with 800+ verified specialists" },
            { icon:<ClipboardList size={15} />, text:"Digital prescriptions & health records" },
            { icon:<ShieldCheck size={15} />, text:"End-to-end encrypted consultations" },
            { icon:<CreditCard size={15} />, text:"Transparent, upfront pricing" },
          ].map(item => (
            <div key={item.text} style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ opacity:0.85, flexShrink:0 }}>{item.icon}</span>{item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", background:"var(--bg-surface)" }}>
        <div style={{ width:"100%", maxWidth:440 }} className="anim-fade-up">
          {/* Mobile logo */}
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", marginBottom:36 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={30} height={30} style={{ objectFit:"contain" }} />
            <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.02em" }}>
              <span style={{ color:"var(--brand)" }}>ez</span><span style={{ color:"var(--text-primary)" }}>Clinic</span>
            </span>
          </Link>

          <div style={{ marginBottom:32 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"var(--brand-surface)", fontSize:"0.75rem", fontWeight:600, color:"var(--brand-text)", marginBottom:12 }}>🧑‍⚕️ Patient Registration</div>
            <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em", marginBottom:6 }}>Create patient account</h1>
            <p style={{ fontSize:"0.9rem", color:"var(--text-muted)" }}>Join thousands of patients on ezClinic.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="fl-group">
              <input type="text" id="p-name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" placeholder=" " />
              <label htmlFor="p-name">Full Name</label>
            </div>

            <div className="fl-group">
              <input type="email" id="p-email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder=" " />
              <label htmlFor="p-email">Email Address</label>
            </div>

            <div className="fl-group">
              <input type="password" id="p-pw" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder=" " />
              <label htmlFor="p-pw">Password</label>
            </div>

            <div className="fl-group">
              <input type="password" id="p-cpw" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} required placeholder=" " />
              <label htmlFor="p-cpw">Confirm Password</label>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"var(--danger-surface)", border:"1px solid var(--danger-border)", color:"var(--danger)", fontSize:"0.8125rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ height:48, borderRadius:12, background:"var(--brand)", color:"white", fontWeight:700, fontSize:"0.9375rem", border:"none", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?0.8:1, transition:"background-color 0.2s, opacity 0.2s" }}
              onMouseEnter={e=>{if(!loading)(e.currentTarget as HTMLButtonElement).style.background="var(--brand-hover)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="var(--brand)";}}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Creating account…
                </>
              ) : "Create Patient Account"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:24, fontSize:"0.875rem", color:"var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color:"var(--brand-text)", fontWeight:600, textDecoration:"none" }}>Sign in</Link>
          </p>
          <p style={{ textAlign:"center", marginTop:8, fontSize:"0.8125rem", color:"var(--text-muted)" }}>
            Are you a doctor?{" "}
            <Link href="/register/doctor" style={{ color:"#0369a1", fontWeight:600, textDecoration:"none" }}>Register as a doctor</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
