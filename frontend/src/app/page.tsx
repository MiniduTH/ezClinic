"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Video, FileText, Sparkles } from "lucide-react";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";

// ── Scroll-triggered animation hook ──────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Data ──────────────────────────────────────────────────
const STATS = [
  { value: "12K+", label: "Active Patients" },
  { value: "800+", label: "Certified Doctors" },
  { value: "98%",  label: "Satisfaction Rate" },
  { value: "24/7", label: "Available Care" },
];

const STEPS = [
  {
    num: "01", icon: <Calendar size={22} color="white" strokeWidth={2} />, title: "Book in Seconds",
    desc: "Choose your specialist and pick a time that suits you. No calls, no waiting rooms.",
    gradient: "linear-gradient(135deg,#E0F2F1,#f0fdf4)",
    accent: "#00796B",
  },
  {
    num: "02", icon: <Video size={22} color="white" strokeWidth={2} />, title: "Video Consultation",
    desc: "Join a secure HD video call from any device. No downloads or plugins required.",
    gradient: "linear-gradient(135deg,#e0f2fe,#f0f9ff)",
    accent: "#0369a1",
  },
  {
    num: "03", icon: <FileText size={22} color="white" strokeWidth={2} />, title: "Prescriptions & Care",
    desc: "Receive digital prescriptions, lab requests and follow-up care plans instantly.",
    gradient: "linear-gradient(135deg,#fef9ee,#fffbeb)",
    accent: "#d97706",
  },
];

const SPECIALISTS = [
  { name: "Dr. Chaminda Perera",      specialty: "Cardiology",   rating: "4.9", reviews: "120", bg: "#00796B", img: "https://img.freepik.com/free-photo/portrait-mature-therapist-sitting-table-looking-camera_1098-18156.jpg?semt=ais_hybrid&w=740&q=80" },
  { name: "Dr. Dilani Wickramasinghe",specialty: "Dermatology",  rating: "4.8", reviews: "95",  bg: "#0369a1", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRY58lNin7YL56UXdVT9Byue0NekUp0YwAD6g&s" },
  { name: "Dr. Ruwan Jayasinghe",     specialty: "Pediatrics",   rating: "5.0", reviews: "200", bg: "#d97706", img: "https://media.licdn.com/dms/image/sync/v2/D4D27AQECXqtIkoVpRQ/articleshare-shrink_800/articleshare-shrink_800/0/1715074230630?e=2147483647&v=beta&t=_NeLnEfIDjW2npy8UgHRkpv85AwbCpXc6FayW8mxeJs" },
];

const AVATAR_COLORS = ["#00796B","#0369a1","#d97706","#7c3aed","#e11d48"];
const AVATAR_INITIALS = ["JD","SM","AK","LP","RC"];

// ═══════════════════════════════════════════════════════════
// Landing Navbar
// ═══════════════════════════════════════════════════════════
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: 68,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 40px",
      backgroundColor: scrolled ? "var(--bg-glass)" : "transparent",
      backdropFilter: scrolled ? "blur(18px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "none",
      transition: "background-color 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Image src="/ezClinicLogo.png" alt="ezClinic" width={34} height={34} style={{ objectFit: "contain" }} />
        <span style={{ fontFamily: "'Manrope', ui-sans-serif, sans-serif", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          <span style={{ color: "var(--brand)" }}>ez</span>
          <span style={{ color: "var(--text-primary)" }}>Clinic</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <nav className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <a href="#how-it-works" style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>How it Works</a>
        <a href="#specialists"  style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none" }}>Specialists</a>
        <Link href="/register" style={{ padding: "8px 16px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 500, color: "var(--text-primary)", textDecoration: "none", border: "1px solid var(--border)", marginLeft: 8 }}>Sign In</Link>
        <Link href="/register" style={{ padding: "8px 20px", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, color: "#fff", textDecoration: "none", background: "var(--brand)", marginLeft: 4 }}>Get Started</Link>
      </nav>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════
// Hero Section
// ═══════════════════════════════════════════════════════════
function HeroSection() {
  return (
    <section className="landing-hero" style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center",
      padding: "88px 40px 72px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative blobs */}
      <div className="landing-hero-blob-1" style={{ position:"absolute", top:"-8%",  right:"-4%", width:640, height:640, borderRadius:"50%", pointerEvents:"none" }} />
      <div className="landing-hero-blob-2" style={{ position:"absolute", bottom:"-8%", left:"-4%", width:520, height:520, borderRadius:"50%", pointerEvents:"none" }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div className="landing-hero-grid">
          {/* ── Left text ── */}
          <div className="anim-fade-up">
            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", borderRadius:999, background:"var(--brand-surface)", border:"1px solid var(--brand-border)", marginBottom:28 }}>
              <span className="anim-live-dot" style={{ width:8, height:8, borderRadius:"50%", background:"var(--brand)", display:"inline-block" }} />
              <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--brand-text)" }}>The Digital Sanctuary</span>
            </div>

            <h1 style={{ fontSize:"clamp(2.4rem,5vw,3.8rem)", fontWeight:800, lineHeight:1.08, color:"var(--text-primary)", marginBottom:24, letterSpacing:"-0.025em" }}>
              Compassionate Care,{" "}
              <span style={{ color:"var(--brand)" }}>Digitally Delivered.</span>
            </h1>

            <p style={{ fontSize:"1.1rem", color:"var(--text-secondary)", lineHeight:1.8, maxWidth:520, marginBottom:40 }}>
              Experience healthcare without the waiting room. Connect with top-tier specialists from the comfort of your home through our secure, intuitive platform.
            </p>

            {/* CTAs */}
            <div className="landing-hero-cta" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:36 }}>
              <Link href="/register"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:12, background:"var(--brand)", color:"#fff", fontSize:"1rem", fontWeight:700, textDecoration:"none", boxShadow:"var(--shadow-brand)", transition:"transform 0.2s ease,box-shadow 0.2s ease" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="";}}>
                Get Started Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
              <Link href="/register"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:12, background:"var(--bg-elevated)", color:"var(--text-primary)", fontSize:"1rem", fontWeight:600, textDecoration:"none", border:"1px solid var(--border)", transition:"background-color 0.2s ease" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-muted)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-elevated)";}}>
                Sign In
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ display:"flex" }}>
                {AVATAR_COLORS.map((bg, i) => (
                  <div key={i} style={{ width:32, height:32, borderRadius:"50%", background:bg, border:"2.5px solid white", marginLeft:i>0?-10:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"0.6rem", fontWeight:800, zIndex:5-i }}>
                    {AVATAR_INITIALS[i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>
                <strong style={{ color:"var(--text-primary)" }}>12,000+</strong> patients trust ezClinic
              </span>
            </div>
          </div>

          {/* ── Right: Glassmorphism card ── */}
          <div className="anim-fade-up anim-d3" style={{ position:"relative" }}>
            <div className="anim-float" style={{ background:"var(--bg-glass)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderRadius:28, border:"1px solid var(--border)", padding:28, boxShadow:"var(--shadow-lg)" }}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <div style={{ width:46, height:46, borderRadius:"50%", background:"linear-gradient(135deg,#00796B,#00897B)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text-primary)" }}>Live Consultation</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Dr. Sachini Fernando · General Practice</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, padding:"4px 10px", borderRadius:999, background:"rgba(239,68,68,0.1)" }}>
                  <span className="anim-live-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#ef4444", display:"inline-block" }} />
                  <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#ef4444", letterSpacing:"0.05em" }}>LIVE</span>
                </div>
              </div>

              {/* Avatar area */}
              <div style={{ height:220, borderRadius:18, overflow:"hidden", marginBottom:16, position:"relative", background:"var(--brand-surface)" }}>
                <img src="https://sa1s3optim.patientpop.com/assets/images/provider/photos/2635379.jpg" alt="Dr. Sachini Fernando" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top" }} />
                {/* Controls */}
                <div style={{ position:"absolute", bottom:16, left:0, right:0, display:"flex", justifyContent:"center", gap:10 }}>
                  {[
                    <svg key="mic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>,
                    <svg key="end" width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>,
                    <svg key="cam" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>,
                  ].map((icon, i) => (
                    <button key={i} style={{ width:38, height:38, borderRadius:"50%", background:i===1?"#ef4444":"rgba(255,255,255,0.9)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next slot */}
              <div style={{ padding:"12px 16px", borderRadius:12, background:"var(--brand-surface)", border:"1px solid var(--brand-border)" }}>
                <div style={{ fontSize:"0.7rem", color:"var(--text-muted)", marginBottom:4, fontWeight:500, letterSpacing:"0.03em" }}>NEXT AVAILABLE SLOT</div>
                <div style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-primary)" }}>Today, 3:00 PM · 15 min session</div>
              </div>
            </div>

            {/* Floating badge – verified */}
            <div className="anim-scale-in anim-d6" style={{ position:"absolute", top:-18, right:-18, padding:"10px 16px", borderRadius:14, background:"var(--bg-elevated)", boxShadow:"var(--shadow-md)", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--brand-surface)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-primary)" }}>Verified Doctors</div>
                <div style={{ fontSize:"0.6875rem", color:"var(--text-muted)" }}>800+ on platform</div>
              </div>
            </div>

            {/* Floating badge – secure */}
            <div className="anim-scale-in anim-d8" style={{ position:"absolute", bottom:-18, left:-18, padding:"10px 16px", borderRadius:14, background:"var(--bg-elevated)", boxShadow:"var(--shadow-md)", display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"#e0f2fe", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-primary)" }}>End-to-End Encrypted</div>
                <div style={{ fontSize:"0.6875rem", color:"var(--text-muted)" }}>HIPAA Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Stats Strip
// ═══════════════════════════════════════════════════════════
function StatsSection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ padding:"56px 40px", background:"var(--bg-elevated)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:32, textAlign:"center" }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(20px)", transition:`opacity 0.55s ease ${i*0.1}s, transform 0.55s ease ${i*0.1}s` }}>
            <div style={{ fontSize:"2.5rem", fontWeight:800, color:"var(--brand)", letterSpacing:"-0.02em", lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginTop:6, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// How It Works
// ═══════════════════════════════════════════════════════════
function HowItWorksSection() {
  const { ref, inView } = useInView();
  return (
    <section id="how-it-works" ref={ref} style={{ padding:"100px 40px", background:"var(--bg-surface)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64, opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(24px)", transition:"all 0.55s ease" }}>
          <div style={{ display:"inline-block", padding:"5px 16px", borderRadius:999, background:"var(--brand-surface)", fontSize:"0.8125rem", fontWeight:600, color:"var(--brand-text)", marginBottom:16 }}>Simple Process</div>
          <h2 style={{ fontSize:"clamp(1.75rem,3vw,2.5rem)", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.022em", marginBottom:14 }}>Your Seamless Healthcare Journey</h2>
          <p style={{ fontSize:"1.05rem", color:"var(--text-secondary)", maxWidth:480, margin:"0 auto", lineHeight:1.75 }}>Three simple steps to connect with your specialist and manage your health from anywhere.</p>
        </div>

        <div className="landing-steps-grid">
          {STEPS.map((step, i) => (
            <div key={step.num}
              style={{ padding:36, borderRadius:24, background:step.gradient, border:"1px solid rgba(0,0,0,0.04)", opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(32px)", transition:`opacity 0.6s ease ${i*0.15}s, transform 0.6s ease ${i*0.15}s, box-shadow 0.25s ease`, cursor:"default" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="0 16px 48px rgba(0,0,0,0.08)";(e.currentTarget as HTMLDivElement).style.transform="translateY(-6px)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow="none";(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
                <div style={{ width:50, height:50, borderRadius:"50%", background:step.accent, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step.icon}</div>
                <span style={{ fontSize:"0.7rem", fontWeight:800, color:step.accent, opacity:0.55, letterSpacing:"0.12em" }}>STEP {step.num}</span>
              </div>
              <h3 style={{ fontSize:"1.25rem", fontWeight:700, color:"#0f172a", marginBottom:12 }}>{step.title}</h3>
              <p  style={{ fontSize:"0.9375rem", color:"#475569", lineHeight:1.75 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Bento (AI + Specialists)
// ═══════════════════════════════════════════════════════════
function BentoSection() {
  const { ref, inView } = useInView();
  return (
    <section id="specialists" ref={ref} style={{ padding:"100px 40px", background:"var(--bg-elevated)" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>

        {/* Top row */}
        <div className="landing-bento-top">
          {/* AI card */}
          <div style={{ borderRadius:28, background:"linear-gradient(135deg,#00796B 0%,#00897B 100%)", padding:44, color:"white", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:260, position:"relative", overflow:"hidden", opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(24px)", transition:"all 0.6s ease" }}>
            <div style={{ position:"absolute", right:-40, top:-40, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", right:10, bottom:-60, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
            <div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"rgba(255,255,255,0.15)", fontSize:"0.75rem", fontWeight:600, marginBottom:20 }}><Sparkles size={13} /> Beta</div>
              <h2 style={{ fontSize:"1.75rem", fontWeight:800, marginBottom:12, lineHeight:1.2 }}>AI Symptom Checker</h2>
              <p style={{ fontSize:"0.9375rem", opacity:0.85, lineHeight:1.7 }}>Not sure what you need? Let our advanced AI guide you to the right care path based on your symptoms.</p>
            </div>
            <Link href="/symptom-checker"
              style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 24px", borderRadius:12, background:"rgba(255,255,255,0.88)", color:"#00796B", fontWeight:700, fontSize:"0.9375rem", textDecoration:"none", marginTop:24, transition:"background-color 0.2s ease" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="white";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.88)";}}>
              Start Assessment
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          {/* Specialists header */}
          <div style={{ borderRadius:28, background:"var(--bg-muted)", padding:44, display:"flex", alignItems:"center", justifyContent:"space-between", gap:24, opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(24px)", transition:"all 0.6s 0.1s ease" }}>
            <div>
              <h2 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", marginBottom:10, lineHeight:1.2 }}>Meet Our Top Specialists</h2>
              <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.65 }}>World-class medical professionals, just a click away.</p>
            </div>
            <Link href="/doctors"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 20px", borderRadius:12, background:"var(--bg-elevated)", color:"var(--brand-text)", fontSize:"0.875rem", fontWeight:600, textDecoration:"none", border:"1px solid var(--border)", whiteSpace:"nowrap", flexShrink:0, transition:"background-color 0.2s ease" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-surface)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="var(--bg-elevated)";}}>
              View All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>
        </div>

        {/* Specialist cards */}
        <div className="landing-specialists-grid">
          {SPECIALISTS.map((doc, i) => (
            <div key={doc.name}
              style={{ borderRadius:24, background:"var(--bg-surface)", overflow:"hidden", cursor:"pointer", border:"1px solid var(--border)", opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(28px)", transition:`opacity 0.6s ease ${(i+2)*0.1}s, transform 0.6s ease ${(i+2)*0.1}s, box-shadow 0.25s ease` }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(-6px)";(e.currentTarget as HTMLDivElement).style.boxShadow="var(--shadow-lg)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";(e.currentTarget as HTMLDivElement).style.boxShadow="none";}}>
              <div style={{ height:200, overflow:"hidden", position:"relative", background:`linear-gradient(135deg,${doc.bg}20,${doc.bg}40)` }}>
                <img src={doc.img} alt={doc.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"top", transition:"transform 0.5s ease" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLImageElement).style.transform="scale(1.06)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLImageElement).style.transform="scale(1)";}} />
              </div>
              <div style={{ padding:22 }}>
                <div style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)", marginBottom:4 }}>{doc.name}</div>
                <div style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginBottom:14 }}>{doc.specialty}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ color:"var(--accent)", fontSize:"1rem" }}>★</span>
                  <span style={{ fontSize:"0.875rem", fontWeight:700, color:"var(--text-primary)" }}>{doc.rating}</span>
                  <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>({doc.reviews}+ reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// CTA Banner
// ═══════════════════════════════════════════════════════════
function CTASection() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref} style={{ padding:"80px 40px", background:"linear-gradient(135deg,#00796B 0%,#00897B 100%)" }}>
      <div style={{ maxWidth:720, margin:"0 auto", textAlign:"center", opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(24px)", transition:"all 0.6s ease" }}>
        <h2 style={{ fontSize:"clamp(1.75rem,3.5vw,2.75rem)", fontWeight:800, color:"white", marginBottom:18, letterSpacing:"-0.02em" }}>
          Ready to experience the future of healthcare?
        </h2>
        <p style={{ fontSize:"1.05rem", color:"rgba(255,255,255,0.8)", marginBottom:36, lineHeight:1.7 }}>
          Join thousands of patients who have made the switch to smart, accessible digital healthcare.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <Link href="/register/patient"
            style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:12, background:"white", color:"#00796B", fontSize:"1rem", fontWeight:700, textDecoration:"none", boxShadow:"0 8px 24px rgba(0,0,0,0.15)", transition:"transform 0.2s ease,box-shadow 0.2s ease" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.transform="";}}>
            I&apos;m a Patient
          </Link>
          <Link href="/register/doctor"
            style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:12, background:"rgba(255,255,255,0.15)", color:"white", fontSize:"1rem", fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.3)", transition:"background-color 0.2s ease" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.22)";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.15)";}}>
            Join as a Doctor
          </Link>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Footer
// ═══════════════════════════════════════════════════════════
function LandingFooter() {
  const footerLinks: { title: string; links: { label: string; href: string }[] }[] = [
    { title:"Platform",  links:[{label:"Find Doctors",href:"/doctors"},{label:"Book Appointment",href:"/login"},{label:"Symptom Checker",href:"/symptom-checker"},{label:"Prescriptions",href:"/login"}] },
    { title:"Company",   links:[{label:"About Us",href:"#"},{label:"Careers",href:"#"},{label:"Privacy Policy",href:"#"},{label:"Terms of Service",href:"#"}] },
    { title:"Support",   links:[{label:"Help Center",href:"#"},{label:"Contact Us",href:"#"},{label:"Status Page",href:"#"}] },
  ];

  return (
    <footer style={{ background:"#0f172a", color:"white", padding:"64px 40px 36px" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>
        <div className="landing-footer-grid" style={{ marginBottom:48 }}>
          {/* Brand column */}
          <div>
            <div style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.3rem", fontWeight:800, marginBottom:16, letterSpacing:"-0.02em" }}>
              <span style={{ color:"#34d399" }}>ez</span>Clinic
            </div>
            <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.45)", lineHeight:1.75, maxWidth:280 }}>
              The digital healthcare sanctuary — connecting patients with certified doctors securely and seamlessly.
            </p>
            {/* Register links in footer */}
            <div style={{ display:"flex", gap:8, marginTop:20, flexWrap:"wrap" }}>
              <Link href="/register/patient" style={{ display:"inline-block", padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", fontSize:"0.75rem", fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.1)", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.14)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.08)";}}>
                Patient Sign Up
              </Link>
              <Link href="/register/doctor" style={{ display:"inline-block", padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", fontSize:"0.75rem", fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.1)", transition:"background-color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.14)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.08)";}}>
                Doctor Sign Up
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(col => (
            <div key={col.title}>
              <div style={{ fontSize:"0.7rem", fontWeight:700, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:18 }}>{col.title}</div>
              {col.links.map(l => (
                <Link key={l.label} href={l.href} style={{ display:"block", fontSize:"0.875rem", color:"rgba(255,255,255,0.55)", textDecoration:"none", marginBottom:12, transition:"color 0.2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="white";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.55)";}}>
                  {l.label}
                </Link>
              ))}
              {col.title === "Support" && (
                <Link href="/admin-login"
                  style={{ display:"inline-flex", alignItems:"center", gap:6, marginTop:8, padding:"6px 14px", borderRadius:8, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.4)", fontSize:"0.75rem", fontWeight:600, textDecoration:"none", border:"1px solid rgba(255,255,255,0.08)", transition:"all 0.2s ease" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.12)";(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.75)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.backgroundColor="rgba(255,255,255,0.06)";(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.4)";}}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Admin Portal
                </Link>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <p style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.3)" }}>© 2026 ezClinic . All rights reserved.</p>
          <div style={{ display:"flex", gap:20 }}>
            {["Privacy","Terms","Cookies"].map(l => (
              <a key={l} href="#" style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.3)", textDecoration:"none", transition:"color 0.2s" }}
                onMouseEnter={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.6)";}}
                onMouseLeave={e=>{(e.currentTarget as HTMLAnchorElement).style.color="rgba(255,255,255,0.3)";}}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════
// Root export
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      const role = getUserRole(user);
      if (role === "admin")  router.replace("/admin");
      else if (role === "doctor") router.replace("/dashboard");
      else router.replace("/profile");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-surface)" }}>
        <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid var(--border)", borderTopColor:"var(--brand)", animation:"spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (user) return null;

  return (
    <div style={{ minHeight:"100vh" }}>
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <BentoSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
