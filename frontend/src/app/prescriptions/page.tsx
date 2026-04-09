"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionForm {
  patientId: string;
  patientName: string;
  appointmentId: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  followUpDate: string;
}

const emptyMedication: Medication = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
};

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Before meals",
  "After meals",
  "At bedtime",
];

const DURATION_OPTIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "30 days",
  "60 days",
  "90 days",
  "Until follow-up",
  "Ongoing",
];

export default function PrescriptionPage() {
  const [form, setForm] = useState<PrescriptionForm>({
    patientId: "",
    patientName: "",
    appointmentId: "",
    diagnosis: "",
    medications: [{ ...emptyMedication }],
    notes: "",
    followUpDate: "",
  });

  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doctorId = "69d71304d77fd0bbf5ec13eb";

  const updateField = (field: keyof PrescriptionForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    setForm((prev) => {
      const meds = [...prev.medications];
      meds[index] = { ...meds[index], [field]: value };
      return { ...prev, medications: meds };
    });
  };

  const addMedication = () => {
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...emptyMedication }],
    }));
  };

  const removeMedication = (index: number) => {
    if (form.medications.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const validate = (): string | null => {
    if (!form.patientId.trim()) return "Patient ID is essential.";
    if (!form.appointmentId.trim()) return "Appointment ID is strictly required.";
    for (let i = 0; i < form.medications.length; i++) {
      const med = form.medications[i];
      if (!med.name.trim()) return `Medication sequence ${i + 1} requires a valid name.`;
      if (!med.dosage.trim()) return `Medication ${i + 1} lacks a dosage.`;
      if (!med.frequency.trim()) return `Medication ${i + 1} lacks frequency rhythms.`;
      if (!med.duration.trim()) return `Medication ${i + 1} awaits a duration span.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSummary(null);

    try {
      const res = await fetch(`${API_URL}/doctors/${doctorId}/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error?.message || "Failed to materialize prescription.");
      }

      setSuccess(true);
      setSummary(data.data?.summary || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      patientId: "",
      patientName: "",
      appointmentId: "",
      diagnosis: "",
      medications: [{ ...emptyMedication }],
      notes: "",
      followUpDate: "",
    });
    setSuccess(false);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 relative font-sans overflow-hidden">
      {/* Light modern blurs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/20 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[150px] pointer-events-none" />
      <div className="fixed top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-violet-400/20 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Header Block */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500">
              Nexus Prescription
            </h1>
            <p className="text-slate-500 mt-3 font-semibold tracking-wider text-sm uppercase">
              Encode Healing Protocols
            </p>
          </div>
          <button
            onClick={resetForm}
            className="group relative px-6 py-3 font-bold text-xs uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-colors"
          >
            <span className="absolute inset-0 bg-white border border-slate-200 rounded-xl scale-95 opacity-0 shadow-sm transition-all group-hover:scale-100 group-hover:opacity-100" />
            <span className="relative z-10 flex items-center gap-2">
              ↻ Reset Nexus
            </span>
          </button>
        </header>

        {/* Global Toasts */}
        {success && (
          <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center gap-4 shadow-sm animate-[slideDown_0.4s_ease-out]">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-teal-200 shadow-sm">
              <span className="text-teal-500 text-lg font-bold">✓</span>
            </div>
            <div>
              <p className="font-bold text-teal-900 tracking-wide">Protocol Transmitted</p>
              <p className="text-sm text-teal-700 font-medium">Digital signature appended successfully.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 shadow-sm animate-[slideDown_0.4s_ease-out]">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-rose-200 shadow-sm">
              <span className="text-rose-500 text-lg font-bold">✕</span>
            </div>
            <p className="font-bold text-rose-900">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* ────── Left Core Form ────── */}
          <form onSubmit={handleSubmit} className="xl:col-span-3 space-y-6">
            
            {/* Subject Data Module */}
            <div className="relative rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all duration-500 hover:shadow-[0_8px_40px_rgb(45,212,191,0.12)]">
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-teal-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="relative p-8 h-full space-y-7">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-xl shadow-sm">
                    ⚗
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Subject Identity</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest pl-1">
                      Subject ID (Required)
                    </label>
                    <input
                      type="text"
                      value={form.patientId}
                      onChange={(e) => updateField("patientId", e.target.value)}
                      placeholder="Mongo / UUID pattern"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-sm placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-teal-600 uppercase tracking-widest pl-1">
                      Session Hash (Required)
                    </label>
                    <input
                      type="text"
                      value={form.appointmentId}
                      onChange={(e) => updateField("appointmentId", e.target.value)}
                      placeholder="Appointment reference"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-sm placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Subject Override Name
                    </label>
                    <input
                      type="text"
                      value={form.patientName}
                      onChange={(e) => updateField("patientName", e.target.value)}
                      placeholder="e.g. Nethmi Perera"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm placeholder-slate-400 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Clinical Pattern
                    </label>
                    <input
                      type="text"
                      value={form.diagnosis}
                      onChange={(e) => updateField("diagnosis", e.target.value)}
                      placeholder="Identified pathology"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-teal-700 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm placeholder-slate-400 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pharmacon Array */}
            <div className="relative rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group transition-all duration-500 hover:shadow-[0_8px_40px_rgb(99,102,241,0.12)]">
               <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
               <div className="relative p-8 h-full space-y-7">
                
                <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl shadow-sm">
                      🧬
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Compounds Array</h2>
                  </div>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="flex items-center gap-2 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    + Inject Compound
                  </button>
                </div>

                <div className="space-y-5">
                  {form.medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="relative p-6 bg-slate-50 border border-slate-200 rounded-2xl group/med hover:bg-white hover:border-indigo-300 transition-colors shadow-sm"
                    >
                      {form.medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(idx)}
                          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover/med:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                      <p className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest mb-5">
                        Index 0{idx + 1}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => updateMedication(idx, "name", e.target.value)}
                            placeholder="Nomenclature (e.g. Paracetamol 500mg)"
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder-slate-400 shadow-sm"
                          />
                        </div>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                          placeholder="Dose quantity"
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm placeholder-slate-400 shadow-sm"
                        />
                        <select
                          value={med.frequency}
                          onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none shadow-sm"
                        >
                          <option value="" className="text-slate-400 bg-white">Select Rhythm</option>
                          {FREQUENCY_OPTIONS.map((f) => (
                            <option key={f} value={f} className="bg-white text-slate-800">{f}</option>
                          ))}
                        </select>
                        <div className="md:col-span-2">
                          <select
                            value={med.duration}
                            onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none shadow-sm"
                          >
                            <option value="" className="text-slate-400 bg-white">Select Lifecycle</option>
                            {DURATION_OPTIONS.map((d) => (
                              <option key={d} value={d} className="bg-white text-slate-800">{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Metascribe */}
            <div className="relative rounded-[2rem] bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="relative p-8 space-y-7">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Physician Notes
                        </label>
                        <textarea
                          value={form.notes}
                          onChange={(e) => updateField("notes", e.target.value)}
                          rows={4}
                          placeholder="Dietary limits, strict variables..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-all text-sm resize-none placeholder-slate-400 shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                          Recursion Date (Follow-up)
                        </label>
                        <input
                          type="date"
                          value={form.followUpDate}
                          onChange={(e) => updateField("followUpDate", e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 transition-all text-sm placeholder-slate-400 shadow-sm"
                        />
                    </div>
                 </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-[2rem] bg-slate-900 border-none transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 shadow-[0_15px_40px_-5px_rgba(15,23,42,0.3)] hover:shadow-[0_20px_50px_-5px_rgba(15,23,42,0.4)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative px-6 py-5 flex flex-col items-center justify-center">
                {loading ? (
                  <span className="flex items-center gap-3 text-white font-bold tracking-widest uppercase">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Compiling Matrix...
                  </span>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-white font-extrabold text-lg tracking-[0.2em] uppercase">Emit Prescription</span>
                    <span className="text-slate-300 text-[10px] uppercase tracking-[0.3em] mt-1 font-semibold">Initiate Blockchain Verification</span>
                  </div>
                )}
              </div>
            </button>
          </form>

          {/* ────── Right Telemetry Monitor ────── */}
          <div className="xl:col-span-2">
            <div className="sticky top-10">
              <div className="relative rounded-[2.5rem] bg-slate-900 shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] before:opacity-10 z-0">
                <div className="relative p-10 h-full min-h-[500px]">
                  
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                      <span className="text-xs font-bold text-white/50 tracking-[0.3em] uppercase">Live Telementry</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/30">RX-OS v3.11</span>
                  </div>

                  {summary ? (
                    <pre className="font-mono text-[11px] leading-relaxed text-teal-100 bg-black/40 p-6 rounded-2xl border border-teal-500/20 whitespace-pre-wrap animate-[fadeIn_0.5s_ease-out]">
                      {summary}
                    </pre>
                  ) : (
                    <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                      <div className="text-center font-mono">
                        <p className="text-xl font-bold tracking-widest text-white">ezClinic</p>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-emerald-400 mt-1 font-semibold">Digital Rx Signature</p>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 font-mono text-xs space-y-3">
                        <div className="flex justify-between border-b border-white/5 pb-3">
                          <span className="text-white/40 uppercase tracking-widest">Ident</span>
                          <span className="text-white font-semibold">{form.patientName || "AWAIT_INPUT"}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-white/40 uppercase tracking-widest">Diag</span>
                          <span className="text-emerald-400 font-bold">{form.diagnosis || "AWAIT_INPUT"}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] ml-1">Compounds</p>
                        {form.medications.some(m => m.name) ? (
                          form.medications.map((m, i) => m.name && (
                            <div key={i} className="pl-4 pr-3 py-3 border-l-[3px] border-indigo-400 bg-white/5 rounded-r-xl">
                              <p className="font-bold text-[13px] text-white font-mono tracking-wide">
                                0{i+1}: <span className="text-indigo-200">{m.name}</span>
                              </p>
                              {(m.dosage || m.frequency || m.duration) && (
                                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1.5 font-mono font-semibold">
                                  {m.dosage} {m.frequency && `• ${m.frequency}`} {m.duration && `• ${m.duration}`}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="h-14 border border-white/10 border-dashed rounded-2xl flex items-center justify-center bg-white/[0.02]">
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest font-semibold">No Compounds Authored</span>
                          </div>
                        )}
                      </div>

                      {form.notes && (
                        <div className="p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10 font-mono text-xs space-y-2">
                          <span className="text-amber-500/50 uppercase tracking-widest block font-bold">Overrides / Notes</span>
                          <span className="text-amber-200/90 italic block leading-relaxed">{form.notes}</span>
                        </div>
                      )}

                      {!form.patientName && !form.diagnosis && !form.medications[0].name && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                            <div className="w-16 h-16 border-2 rounded-full border-white/10 flex items-center justify-center mb-4 bg-white/5">
                                <span className="text-2xl pt-1 opacity-50 text-white">👁</span>
                            </div>
                            <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-white/50">Scanner Idle</span>
                         </div>
                      )}
                    </div>
                  )}

                  {/* Aesthetic grid overlay for the monitor */}
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTEgMWh2MThIMVYxeiIgb3BhY2l0eT0iLjAzIi8+PC9zdmc+')] pointer-events-none rounded-[2.5rem] mix-blend-overlay opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; filter: blur(5px); transform: translateY(-5px); }
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
