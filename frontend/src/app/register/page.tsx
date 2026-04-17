"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Stethoscope, ShieldCheck, CheckCircle2, Gift, LogIn, UserPlus } from "lucide-react";

export default function RegisterPage() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 16px", background:"linear-gradient(160deg,#f0fdf4 0%,#e0f2fe 45%,#f8fafc 100%)" }}>
      {/* Decorative blobs */}
      <div style={{ position:"fixed", top:"-10%", right:"-5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(15,110,86,0.07) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />
      <div style={{ position:"fixed", bottom:"-8%", left:"-4%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(3,105,161,0.05) 0%,transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ width:"100%", maxWidth:620, position:"relative", zIndex:1 }} className="anim-fade-up">
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:16 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={40} height={40} style={{ objectFit:"contain" }} />
            <span style={{ fontFamily:"ui-monospace,monospace", fontSize:"1.4rem", fontWeight:700 }}>
              <span style={{ color:"#0f6e56" }}>ez</span>
              <span style={{ color:"#0f172a" }}>Clinic</span>
            </span>
          </Link>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"#0f172a", marginBottom:6, letterSpacing:"-0.02em" }}>Welcome to ezClinic</h1>
          <p style={{ color:"#94a3b8", fontSize:"0.9375rem" }}>Choose your role to get started or sign in.</p>
        </div>

        {/* Role cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
          {/* Patient card */}
          <div style={{ padding:28, borderRadius:20, background:"white", border:"1px solid #e2e8f0", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"#e1f5ee", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Heart size={22} color="#0f6e56" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#0f172a", margin:0 }}>Patient</h3>
                <p style={{ fontSize:"0.8125rem", color:"#94a3b8", margin:0 }}>Book & manage care</p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <Link href="/register/patient"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"#0f6e56", color:"white", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", transition:"opacity 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="0.88";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.opacity="1";}}>
                <UserPlus size={15} /> Create Account
              </Link>
              <Link href="/login?role=patient"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"#f1f5f9", color:"#0f6e56", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", border:"1px solid #e2e8f0", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="#e1f5ee";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="#f1f5f9";}}>
                <LogIn size={15} /> Sign In
              </Link>
            </div>
          </div>

          {/* Doctor card */}
          <div style={{ padding:28, borderRadius:20, background:"white", border:"1px solid #e2e8f0", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Stethoscope size={22} color="#0369a1" strokeWidth={2} />
              </div>
              <div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:"#0f172a", margin:0 }}>Doctor</h3>
                <p style={{ fontSize:"0.8125rem", color:"#94a3b8", margin:0 }}>Join & see patients</p>
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
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:10, background:"#f1f5f9", color:"#0369a1", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", border:"1px solid #e2e8f0", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="#e0f2fe";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="#f1f5f9";}}>
                <LogIn size={15} /> Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div style={{ display:"flex", justifyContent:"center", gap:24, marginBottom:24, flexWrap:"wrap" }}>
          {[
            { icon:<ShieldCheck size={14} color="#0f6e56" />, text:"HIPAA Compliant" },
            { icon:<CheckCircle2 size={14} color="#0369a1" />, text:"Verified Doctors" },
            { icon:<Gift size={14} color="#d97706" />, text:"Free to Join" },
          ].map(item => (
            <div key={item.text} style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.8125rem", color:"#64748b" }}>
              {item.icon}
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Admin portal */}
        <div style={{ textAlign:"center" }}>
          <Link href="/admin-login"
            style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:"0.8125rem", color:"#94a3b8", textDecoration:"none", padding:"6px 14px", borderRadius:8, border:"1px solid #e2e8f0", transition:"all 0.2s" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#475569";(e.currentTarget as HTMLAnchorElement).style.borderColor="#cbd5e1";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="#94a3b8";(e.currentTarget as HTMLAnchorElement).style.borderColor="#e2e8f0";}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
