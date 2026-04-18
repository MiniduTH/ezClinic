"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Stethoscope, ShieldCheck, CheckCircle2, Gift, LogIn, UserPlus } from "lucide-react";

export default function RegisterPage() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px", background:"linear-gradient(160deg,#E0F2F1 0%,#e0f2fe 45%,var(--bg-surface) 100%)" }}>
      {/* Decorative blobs */}
      <div style={{ position:"fixed", top:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,121,107,0.07) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-8%", left:"-4%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(3,105,161,0.05) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ width:"100%", maxWidth:620, position:"relative", zIndex:1 }} className="anim-fade-up">
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:16 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={40} height={40} style={{ objectFit:"contain" }} />
            <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.4rem", fontWeight:800, letterSpacing:"-0.02em" }}>
              <span style={{ color:"var(--brand)" }}>ez</span>
              <span style={{ color:"var(--text-primary)" }}>Clinic</span>
            </span>
          </Link>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", marginBottom:6, letterSpacing:"-0.02em" }}>Welcome to ezClinic</h1>
          <p style={{ color:"var(--text-muted)", fontSize:"0.9375rem" }}>Choose your role to get started or sign in.</p>
        </div>

        {/* Role cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          {/* Patient card */}
          <div style={{ padding:28, borderRadius:20, background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"var(--brand-surface)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Heart size={22} color="var(--brand)" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-primary)", margin:0 }}>Patient</h3>
                <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", margin:0 }}>Book & manage care</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Link href="/register/patient"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"var(--brand)", color:"white", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", transition:"opacity 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="0.88";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="1";}}>
                <UserPlus size={15} /> Create Account
              </Link>
              <Link href="/login?role=patient"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"var(--bg-muted)", color:"var(--brand-text)", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", border:"1px solid var(--border)", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--brand-surface)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-muted)";}}>
                <LogIn size={15} /> Sign In
              </Link>
            </div>
          </div>

          {/* Doctor card */}
          <div style={{ padding:28, borderRadius:20, background:"var(--bg-elevated)", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Stethoscope size={22} color="#0369a1" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-primary)", margin:0 }}>Doctor</h3>
                <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", margin:0 }}>Join & see patients</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Link href="/register/doctor"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"#0369a1", color:"white", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", transition:"opacity 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="0.88";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="1";}}>
                <UserPlus size={15} /> Apply as Doctor
              </Link>
              <Link href="/login?role=doctor"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"var(--bg-muted)", color:"#0369a1", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", border:"1px solid var(--border)", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="#e0f2fe";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-muted)";}}>
                <LogIn size={15} /> Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:<ShieldCheck size={14} color="var(--brand)" />, text:"HIPAA Compliant" },
            { icon:<CheckCircle2 size={14} color="#0369a1" />, text:"Verified Doctors" },
            { icon:<Gift size={14} color="#d97706" />, text:"Free to Join" },
          ].map(item => (
            <div key={item.text} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8125rem", color:"var(--text-secondary)" }}>
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Admin portal */}
        <div style={{ textAlign:"center" }}>
          <Link href="/admin-login"
            style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:"0.8125rem", color:"var(--text-muted)", textDecoration:"none", padding:"6px 14px", borderRadius:8, border:"1px solid var(--border)", transition:"all 0.2s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-secondary)";(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--border-strong)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="var(--text-muted)";(e.currentTarget as HTMLAnchorElement).style.borderColor="var(--border)";}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
