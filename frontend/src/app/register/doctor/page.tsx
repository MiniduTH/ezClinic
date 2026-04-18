"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarClock, DollarSign, ShieldCheck, FileText, CheckCircle2, Paperclip, Upload } from "lucide-react";

const DOCTOR_API   = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";
const ALLOWED_TYPES = ["application/pdf","image/jpeg","image/png"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES     = 5;

const SPECIALIZATIONS = [
  "General Practice","Internal Medicine","Pediatrics","Cardiology","Dermatology",
  "ENT","Psychiatry","Neurology","Orthopedics","Obstetrics & Gynecology",
  "Ophthalmology","Radiology","Anesthesiology","Endocrinology","Gastroenterology",
  "Nephrology","Pulmonology","Urology","Oncology","Surgery",
];

export default function DoctorRegisterPage() {
  const router      = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [specializationOption, setSpecializationOption] = useState("");
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [bio, setBio]           = useState("");
  const [files, setFiles]       = useState<File[]>([]);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pending, setPending]   = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const invalid = selected.find(f => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);
    if (invalid) { setError("Files must be PDF, JPEG, or PNG and under 5 MB each."); return; }
    setFiles(prev => [...prev, ...selected].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const finalSpec = specializationOption === "other" ? customSpecialization : specializationOption;
      const body: Record<string,unknown> = { name, email, password, role:"doctor" };
      if (finalSpec)       body.specialization  = finalSpec;
      if (qualification)   body.qualification   = qualification;
      if (bio)             body.bio             = bio;
      if (consultationFee) body.consultationFee = Number(consultationFee);

      const res = await fetch("/api/auth/register", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }

      // Upload credentials
      if (files.length > 0) {
        try {
          const tokenRes = await fetch("/api/auth/token");
          const tokenData = await tokenRes.json();
          if (tokenData.accessToken) {
            const formData = new FormData();
            files.forEach(f => formData.append("files", f));
            await fetch(`${DOCTOR_API}/doctors/me/credentials`, {
              method:"POST",
              headers:{ Authorization:`Bearer ${tokenData.accessToken}` },
              body: formData,
            });
          }
        } catch { /* non-fatal */ }
      }

      setPending(true);
      setTimeout(() => router.push("/login"), 5000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg-surface)", padding:24 }}>
        <div style={{ maxWidth:480, textAlign:"center" }} className="anim-scale-in">
          <div style={{ width:80, height:80, borderRadius:"50%", background:"var(--brand-surface)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}><CheckCircle2 size={36} color="var(--brand)" strokeWidth={2} /></div>
          <h2 style={{ fontSize:"1.5rem", fontWeight:800, color:"var(--text-primary)", marginBottom:12 }}>Account submitted!</h2>
          <p style={{ color:"var(--text-secondary)", lineHeight:1.75, marginBottom:24 }}>Your account is pending admin verification. You&apos;ll be notified once approved. Redirecting to login in 5 seconds…</p>
          <Link href="/login" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:12, background:"var(--brand)", color:"white", fontWeight:700, textDecoration:"none", fontSize:"0.9375rem" }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg-surface)" }}>
      {/* Left panel */}
      <div style={{ flex:"0 0 400px", background:"linear-gradient(160deg,#0369a1 0%,#0284c7 100%)", padding:"60px 44px", display:"flex", flexDirection:"column", justifyContent:"space-between", position:"relative", overflow:"hidden" }} className="hidden-mobile">
        <div style={{ position:"absolute", right:-50, top:-50, width:250, height:250, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", left:-30, bottom:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div>
          <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:10, textDecoration:"none", marginBottom:60 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={36} height={36} style={{ objectFit:"contain", filter:"brightness(0) invert(1)" }} />
            <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.2rem", fontWeight:800, color:"white", letterSpacing:"-0.02em" }}>ezClinic</span>
          </Link>
          <h2 style={{ fontSize:"2rem", fontWeight:800, color:"white", marginBottom:16, lineHeight:1.2 }}>Expand your practice online.</h2>
          <p style={{ fontSize:"1rem", color:"rgba(255,255,255,0.75)", lineHeight:1.75 }}>Reach more patients, set your own schedule, and deliver quality care from anywhere.</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { icon:<CalendarClock size={15} />, text:"Set your own availability & schedule" },
            { icon:<DollarSign size={15} />,    text:"Transparent consultation fee control" },
            { icon:<ShieldCheck size={15} />,   text:"Secure video consultation platform" },
            { icon:<FileText size={15} />,      text:"Digital prescriptions & records" },
          ].map(item => (
            <div key={item.text} style={{ fontSize:"0.875rem", color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ opacity:0.85, flexShrink:0 }}>{item.icon}</span>{item.text}
            </div>
          ))}
          <div style={{ marginTop:12, padding:"12px 16px", borderRadius:12, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontSize:"0.75rem", fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>VERIFICATION NOTE</div>
            <div style={{ fontSize:"0.8125rem", color:"rgba(255,255,255,0.85)", lineHeight:1.6 }}>Your account will be reviewed by our admin team before activation. Please upload your credentials.</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, overflowY:"auto", padding:"40px 32px", display:"flex", alignItems:"flex-start", justifyContent:"center", background:"var(--bg-surface)" }}>
        <div style={{ width:"100%", maxWidth:480, paddingBottom:40 }} className="anim-fade-up">
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", marginBottom:36 }}>
            <Image src="/ezClinicLogo.png" alt="ezClinic" width={30} height={30} style={{ objectFit:"contain" }} />
            <span style={{ fontFamily:"'Manrope', ui-sans-serif, sans-serif", fontSize:"1.1rem", fontWeight:800, letterSpacing:"-0.02em" }}>
              <span style={{ color:"#0369a1" }}>ez</span><span style={{ color:"var(--text-primary)" }}>Clinic</span>
            </span>
          </Link>

          <div style={{ marginBottom:32 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"#e0f2fe", fontSize:"0.75rem", fontWeight:600, color:"#0369a1", marginBottom:12 }}>👨‍⚕️ Doctor Registration</div>
            <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.02em", marginBottom:6 }}>Join as a doctor</h1>
            <p style={{ fontSize:"0.9rem", color:"var(--text-muted)" }}>Fill in your details to get verified on ezClinic.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {/* Basic info */}
            <div className="fl-group">
              <input type="text" id="d-name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name" placeholder=" " />
              <label htmlFor="d-name">Full Name</label>
            </div>

            <div className="fl-group">
              <input type="email" id="d-email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder=" " />
              <label htmlFor="d-email">Email Address</label>
            </div>

            <div className="fl-group">
              <input type="password" id="d-pw" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder=" " />
              <label htmlFor="d-pw">Password (min. 8 characters)</label>
            </div>

            {/* Section divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)" }}>Professional Info</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>

            {/* Specialization */}
            <div>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:500, color:"var(--text-secondary)", marginBottom:8 }}>Specialization</label>
              <select value={specializationOption} onChange={e=>{setSpecializationOption(e.target.value);if(e.target.value!=="other")setCustomSpecialization("");}}
                style={{ width:"100%", height:48, border:"1px solid var(--border)", borderRadius:10, padding:"0 12px", fontSize:"0.875rem", background:"var(--bg-elevated)", color:"var(--text-primary)", outline:"none" }}>
                <option value="">Select a specialization…</option>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                <option value="other">Other (specify)</option>
              </select>
              {specializationOption === "other" && (
                <input type="text" value={customSpecialization} onChange={e=>setCustomSpecialization(e.target.value)} placeholder="Enter your specialization" style={{ width:"100%", height:44, border:"1px solid var(--border)", borderRadius:10, padding:"0 12px", fontSize:"0.875rem", background:"var(--bg-elevated)", color:"var(--text-primary)", outline:"none", marginTop:8, boxSizing:"border-box" }} />
              )}
            </div>

            <div className="fl-group">
              <input type="text" id="d-qual" value={qualification} onChange={e=>setQualification(e.target.value)} placeholder=" " />
              <label htmlFor="d-qual">Qualifications (e.g. MBBS, MD)</label>
            </div>

            <div className="fl-group">
              <input type="number" id="d-fee" value={consultationFee} onChange={e=>setConsultationFee(e.target.value)} placeholder=" " min="0" step="0.01" />
              <label htmlFor="d-fee">Consultation Fee (LKR)</label>
            </div>

            <div>
              <label style={{ display:"block", fontSize:"0.8125rem", fontWeight:500, color:"var(--text-secondary)", marginBottom:8 }}>Short Bio <span style={{ fontWeight:400, color:"var(--text-muted)" }}>(optional)</span></label>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Brief professional summary…"
                style={{ width:"100%", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", fontSize:"0.875rem", background:"var(--bg-elevated)", color:"var(--text-primary)", resize:"none", outline:"none", boxSizing:"border-box" }} />
            </div>

            {/* Section divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"4px 0" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)" }}>Credential Documents</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>

            {/* File upload */}
            <div>
              <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={files.length>=MAX_FILES}
                style={{ width:"100%", padding:"20px 16px", borderRadius:12, border:"2px dashed var(--border)", background:"var(--bg-muted)", cursor:files.length>=MAX_FILES?"not-allowed":"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:8, opacity:files.length>=MAX_FILES?0.5:1 }}>
                <Upload size={24} color="var(--text-muted)" strokeWidth={2} />
                <div style={{ fontSize:"0.875rem", color:"var(--text-secondary)", fontWeight:500 }}>{files.length>=MAX_FILES?"Max 5 files reached":"Upload credential documents"}</div>
                <div style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>Medical license, degree · PDF/JPEG/PNG · max 5 MB each</div>
              </button>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display:"none" }} />
              {files.length > 0 && (
                <ul style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                  {files.map((f,i) => (
                    <li key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:8, background:"var(--bg-elevated)", border:"1px solid var(--border)", fontSize:"0.8125rem", color:"var(--text-secondary)" }}>
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:8, display:"flex", alignItems:"center", gap:6 }}><Paperclip size={12} /> {f.name}</span>
                      <button type="button" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{ color:"var(--danger)", background:"none", border:"none", cursor:"pointer", fontWeight:700, flexShrink:0 }}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Verification note */}
            <div style={{ display:"flex", gap:10, padding:"12px 14px", borderRadius:10, background:"var(--warning-surface)", border:"1px solid var(--warning-border)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p style={{ fontSize:"0.8125rem", color:"var(--warning-text)", lineHeight:1.6, margin:0 }}>Your account requires admin verification before activation. This typically takes 1–2 business days.</p>
            </div>

            {error && (
              <div style={{ padding:"10px 14px", borderRadius:10, background:"var(--danger-surface)", border:"1px solid var(--danger-border)", color:"var(--danger)", fontSize:"0.8125rem" }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ height:50, borderRadius:12, background:"#0369a1", color:"white", fontWeight:700, fontSize:"0.9375rem", border:"none", cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?0.8:1, transition:"background-color 0.2s, opacity 0.2s" }}>
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  Submitting…
                </>
              ) : "Submit Doctor Registration"}
            </button>
          </form>

          <p style={{ textAlign:"center", marginTop:24, fontSize:"0.875rem", color:"var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login?role=doctor" style={{ color:"#0369a1", fontWeight:600, textDecoration:"none" }}>Sign in as a doctor</Link>
          </p>
          <p style={{ textAlign:"center", marginTop:8, fontSize:"0.8125rem", color:"var(--text-muted)" }}>
            Are you a patient?{" "}
            <Link href="/register/patient" style={{ color:"var(--brand-text)", fontWeight:600, textDecoration:"none" }}>Register as a patient</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
