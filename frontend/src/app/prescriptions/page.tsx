"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";

const DOCTOR_API = process.env.NEXT_PUBLIC_DOCTOR_SERVICE_URL || process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";
const APPOINTMENT_API = process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004/api/v1";
const PATIENT_API = process.env.NEXT_PUBLIC_PATIENT_SERVICE_URL || process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";

interface Medication { name: string; dosage: string; frequency: string; duration: string; }
interface PrescriptionForm { patientId: string; patientName: string; appointmentId: string; diagnosis: string; medications: Medication[]; notes: string; followUpDate: string; }
interface Patient { id: string; name: string; email: string; phone?: string | null; dob?: string | null; bloodType?: string | null; allergies?: string | null; }
interface Appointment { id: string; patientId: string; patient?: Patient; date: string; time: string; status: string; reason?: string; }
interface Prescription { _id?: string; id?: string; doctorId: string | { _id?: string; id?: string; name?: string }; patientId: string; patientName?: string; appointmentId: string; diagnosis?: string; medications: Medication[]; notes?: string; followUpDate?: string; issuedAt?: string; }

const emptyMed = (): Medication => ({ name: "", dosage: "", frequency: "", duration: "" });
const FREQ = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "Every 6 hours", "Every 8 hours", "Every 12 hours", "As needed", "Before meals", "After meals", "At bedtime"];
const DUR = ["3 days", "5 days", "7 days", "10 days", "14 days", "21 days", "30 days", "60 days", "90 days", "Until follow-up", "Ongoing"];

async function getToken() { const r = await fetch("/api/auth/token"); if (!r.ok) throw new Error("Not authenticated."); const { accessToken } = await r.json(); return accessToken; }
async function fetchPatient(pid: string, token: string): Promise<Patient | null> {
  try { const r = await fetch(`${PATIENT_API}/patients/${pid}`, { headers: { Authorization: `Bearer ${token}` } }); if (!r.ok) return null; const d = await r.json(); const p = d?.data ?? d; return { id: p.id || p._id, name: p.name, email: p.email, phone: p.phone, dob: p.dob, bloodType: p.bloodType, allergies: p.allergies }; } catch { return null; }
}

function DoctorPrescriptions() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState<PrescriptionForm>({ patientId: "", patientName: "", appointmentId: "", diagnosis: "", medications: [emptyMed()], notes: "", followUpDate: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  // ─── Bootstrap ────────────────────────────────────────────────
  const bootstrap = useCallback(async () => {
    setInitLoading(true); setInitError(null);
    try {
      const token = await getToken();
      const h = { Authorization: `Bearer ${token}` };
      const meRes = await fetch(`${DOCTOR_API}/doctors/me`, { headers: h });
      if (!meRes.ok) throw new Error("Could not load doctor profile.");
      const me = await meRes.json();
      const id: string = me.data?.id || me.data?._id || me.id;
      setDoctorId(id);
      // appointments (non-blocking)
      try {
        const ar = await fetch(`${APPOINTMENT_API}/appointments/doctor/${id}`, { headers: h });
        if (ar.ok) {
          const ad = await ar.json();
          const raw: Record<string, unknown>[] = Array.isArray(ad) ? ad : ad.data || [];
          const filtered = raw.filter(a => ["CONFIRMED", "COMPLETED", "accepted", "completed"].includes(((a.status as string) || "").toUpperCase()));
          const enriched: Appointment[] = await Promise.all(filtered.map(async a => {
            const patient = a.patientId ? await fetchPatient(a.patientId as string, token) : null;
            return { id: (a.id || a._id) as string, patientId: a.patientId as string, patient: patient ?? undefined, date: (a.date || a.appointmentDate || "") as string, time: (a.time || a.appointmentTime || "") as string, status: ((a.status as string) || "").toUpperCase(), reason: (a.reason || "") as string };
          }));
          setAppointments(enriched);
        }
      } catch { }
      // prescriptions
      await loadPrescriptions(id, token);
    } catch (e) { setInitError(e instanceof Error ? e.message : "Init failed."); }
    finally { setInitLoading(false); }
  }, []);

  const loadPrescriptions = async (did: string, token?: string) => {
    setListLoading(true);
    try {
      const t = token || await getToken();
      const r = await fetch(`${DOCTOR_API}/doctors/${did}/prescriptions`, { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) { const d = await r.json(); setPrescriptions(d.data || []); }
    } catch { } finally { setListLoading(false); }
  };

  useEffect(() => { bootstrap(); }, [bootstrap]);

  // ─── Appointment select ────────────────────────────────────────
  const handleApptSelect = async (apptId: string) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) { setForm(p => ({ ...p, appointmentId: apptId })); return; }
    setForm(p => ({ ...p, appointmentId: apptId, patientId: appt.patientId || p.patientId, patientName: appt.patient?.name || p.patientName }));
    if (appt.patient) { setSelectedPatient(appt.patient); return; }
    if (appt.patientId) {
      setPatientLoading(true);
      try { const t = await getToken(); const pt = await fetchPatient(appt.patientId, t); if (pt) { setSelectedPatient(pt); setForm(p => ({ ...p, patientId: pt.id, patientName: pt.name })); } }
      finally { setPatientLoading(false); }
    }
    setFormError(null);
  };

  const uf = (k: keyof PrescriptionForm, v: string) => { setForm(p => ({ ...p, [k]: v })); setFormError(null); };
  const um = (i: number, k: keyof Medication, v: string) => setForm(p => { const m = [...p.medications]; m[i] = { ...m[i], [k]: v }; return { ...p, medications: m }; });
  const addMed = () => setForm(p => ({ ...p, medications: [...p.medications, emptyMed()] }));
  const remMed = (i: number) => { if (form.medications.length <= 1) return; setForm(p => ({ ...p, medications: p.medications.filter((_, j) => j !== i) })); };

  const validate = () => {
    if (!form.patientId.trim()) return "Patient ID is required.";
    for (let i = 0; i < form.medications.length; i++) {
      const m = form.medications[i];
      if (!m.name.trim()) return `Medication ${i + 1}: name required.`;
      if (!m.dosage.trim()) return `Medication ${i + 1}: dosage required.`;
      if (!m.frequency.trim()) return `Medication ${i + 1}: frequency required.`;
      if (!m.duration.trim()) return `Medication ${i + 1}: duration required.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(); if (err) { setFormError(err); return; }
    if (!doctorId) { setFormError("Doctor profile not loaded."); return; }
    setSubmitting(true); setFormError(null);
    try {
      const token = await getToken();
      // Strip empty optional fields so backend validators don't choke
      const payload: Record<string, any> = {
        patientId: form.patientId.trim(),
        medications: form.medications,
        ...(form.patientName.trim() && { patientName: form.patientName.trim() }),
        ...(form.appointmentId.trim() && { appointmentId: form.appointmentId.trim() }),
        ...(form.diagnosis.trim() && { diagnosis: form.diagnosis.trim() }),
        ...(form.notes.trim() && { notes: form.notes.trim() }),
        // Only send followUpDate if user actually picked one — must be ISO 8601
        ...(form.followUpDate && { followUpDate: new Date(form.followUpDate).toISOString() }),
      };
      const r = await fetch(`${DOCTOR_API}/doctors/${doctorId}/prescriptions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { const msg = Array.isArray(d?.message) ? d.message.join(", ") : d?.message; throw new Error(msg || "Failed."); }
      showToast("Prescription issued successfully!");
      setShowForm(false);
      resetForm();
      await loadPrescriptions(doctorId);
    } catch (e) { setFormError(e instanceof Error ? e.message : "An error occurred"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    // Doctor service doesn't expose DELETE /prescriptions/:id yet — show info toast
    setDeleteId(null);
    showToast("Delete not yet supported by the API.", false);
  };

  const resetForm = () => { setForm({ patientId: "", patientName: "", appointmentId: "", diagnosis: "", medications: [emptyMed()], notes: "", followUpDate: "" }); setSelectedPatient(null); setFormError(null); };
  const openForm = () => { resetForm(); setShowForm(true); };
  const closeForm = () => { setShowForm(false); resetForm(); };


  // ─── Loading / Error ──────────────────────────────────────────
  if (initLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    </div>
  );
  if (initError) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-sm text-center space-y-4">
        <p className="text-red-600 text-sm font-medium">{initError}</p>
        <button onClick={bootstrap} className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700">Retry</button>
      </div>
    </div>
  );

  // ─── Helpers ──────────────────────────────────────────────────
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const initials = (name?: string) => name ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.ok ? "bg-teal-600 text-white" : "bg-red-600 text-white"}`}>
          <span>{toast.ok ? "✓" : "✕"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-base font-bold text-gray-900">Delete Prescription?</h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm text-white bg-red-600 rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* View prescription modal */}
      {viewRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Prescription Details</h2>
              <button onClick={() => setViewRx(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Patient</p><p className="font-semibold text-gray-900">{viewRx.patientName || viewRx.patientId}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Diagnosis</p><p className="font-semibold text-gray-900">{viewRx.diagnosis || "—"}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">Issued</p><p className="font-semibold text-gray-900">{fmtDate(viewRx.issuedAt)}</p></div>
                {viewRx.followUpDate && <div className="bg-teal-50 rounded-xl p-3"><p className="text-xs text-teal-500 mb-1">Follow-up</p><p className="font-semibold text-teal-800">{fmtDate(viewRx.followUpDate)}</p></div>}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Medications</p>
                <div className="space-y-2">
                  {viewRx.medications.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      <div><p className="text-sm font-semibold text-gray-900">{m.name}</p><p className="text-xs text-gray-500">{m.dosage} · {m.frequency} · {m.duration}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              {viewRx.notes && <div className="p-3 bg-amber-50 rounded-xl border border-amber-100"><p className="text-xs font-bold text-amber-600 mb-1">Notes</p><p className="text-sm text-amber-900">{viewRx.notes}</p></div>}
            </div>
            <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button onClick={() => setViewRx(null)} className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700">Close</button>
            </div>
          </div>
        </div>
      )}


      {/* ── Add Prescription Slide-over Form ── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={closeForm} />
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Prescription</h2>
                <p className="text-xs text-gray-400 mt-0.5">Issue a digital prescription for a patient</p>
              </div>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <span className="shrink-0">⚠</span>{formError}
                </div>
              )}

              {/* PATIENT & APPOINTMENT */}
              <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Patient & Appointment</p>
                </div>
                <div className="p-5 space-y-4">
                  {/* Appointment dropdown */}
                  {appointments.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Select from confirmed appointments</label>
                      <select value={form.appointmentId} onChange={e => handleApptSelect(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none">
                        <option value="">Choose an appointment…</option>
                        {appointments.map(a => <option key={a.id} value={a.id}>{a.patient?.name || a.patientId} — {a.date} {a.time}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Patient card */}
                  {patientLoading && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-teal-500" />Fetching patient…
                    </div>
                  )}
                  {selectedPatient && !patientLoading && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials(selectedPatient.name)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{selectedPatient.name}</p>
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-md">Active</span>
                        </div>
                        <p className="text-xs text-gray-400">Patient ID: {selectedPatient.id}{selectedPatient.dob ? ` · DOB: ${fmtDate(selectedPatient.dob)}` : ""}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Patient ID <span className="text-red-400">*</span></label>
                      <input type="text" value={form.patientId} onChange={e => uf("patientId", e.target.value)} placeholder="PAT-00412" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Appointment ID</label>
                      <input type="text" value={form.appointmentId} onChange={e => uf("appointmentId", e.target.value)} placeholder="APT-00XXX (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                      <input type="date" value={form.followUpDate} onChange={e => uf("followUpDate", e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Diagnosis / Condition</label>
                      <input type="text" value={form.diagnosis} onChange={e => uf("diagnosis", e.target.value)} placeholder="e.g. Acute pharyngitis" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </section>

              {/* MEDICATIONS */}
              <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Medications</p>
                </div>
                <div className="p-5 space-y-3">
                  {/* Table header */}
                  <div className="grid grid-cols-[2rem_1fr_5rem_7rem_6rem_2rem] gap-2 px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">#</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Drug Name</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Dosage</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Frequency</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Duration</span>
                    <span />
                  </div>
                  {form.medications.map((med, i) => (
                    <div key={i} className="grid grid-cols-[2rem_1fr_5rem_7rem_6rem_2rem] gap-2 items-center">
                      <span className="text-sm text-gray-400 font-medium text-center">{i + 1}</span>
                      <input type="text" value={med.name} onChange={e => um(i, "name", e.target.value)} placeholder="Amoxicillin 500mg" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      <input type="text" value={med.dosage} onChange={e => um(i, "dosage", e.target.value)} placeholder="500mg" className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      <select value={med.frequency} onChange={e => um(i, "frequency", e.target.value)} className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white">
                        <option value="">Select</option>
                        {FREQ.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <input type="text" value={med.duration} onChange={e => um(i, "duration", e.target.value)} placeholder="7 days" className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                      <button type="button" onClick={() => remMed(i)} disabled={form.medications.length <= 1} className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 text-xs disabled:opacity-30 transition-colors">×</button>
                    </div>
                  ))}
                  <button type="button" onClick={addMed} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:text-teal-600 transition-colors mt-1">
                    + Add medication
                  </button>
                </div>
              </section>

              {/* ADDITIONAL NOTES */}
              <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Additional Notes</p>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Clinical notes / Instructions</label>
                    <textarea value={form.notes} onChange={e => uf("notes", e.target.value)} rows={3} placeholder="e.g. Take with food. Avoid alcohol. Return if symptoms persist beyond 5 days." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Details / Summary</label>
                    <input type="text" value={form.patientName} onChange={e => uf("patientName", e.target.value)} placeholder="Short summary for the record (optional)" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
                  </div>
                </div>
              </section>
            </div>

            {/* Form footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white">
              <button type="button" onClick={closeForm} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="button" onClick={handleSubmit as any} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {submitting ? "Issuing…" : <>Issue prescription <span className="text-base leading-none">↗</span></>}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Main Page ── */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Prescriptions</h1>
            <p className="page-subtitle">Manage and issue digital prescriptions</p>
          </div>
          <button onClick={openForm} className="btn-gradient">
            <span className="text-base leading-none">+</span> Add Prescription
          </button>
        </div>

        {/* Prescriptions list */}
        {listLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="glass-card-premium">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
                  <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="18" x2="12" y2="12" />
                  <line strokeLinecap="round" strokeLinejoin="round" x1="9" y1="15" x2="15" y2="15" />
                </svg>
              </div>
              <div className="empty-state-title">No prescriptions yet</div>
              <div className="empty-state-desc">Issue your first prescription to get started.</div>
              <button onClick={openForm} className="btn-gradient mt-2">+ Add Prescription</button>
            </div>
          </div>
        ) : (
          <div className="glass-card-premium overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_6rem_5rem_5rem] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
              {["Patient", "Diagnosis", "Medications", "Issued", "Follow-up", ""].map((h, i) => (
                <span key={i} className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>
            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {prescriptions.map((rx) => {
                const rxId = rx._id || rx.id || "";
                return (
                  <div key={rxId} className="grid grid-cols-[1fr_1fr_1fr_6rem_5rem_5rem] gap-4 px-6 py-4 items-center hover:bg-gray-50/60 transition-colors group">
                    {/* Patient */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                        {initials(rx.patientName)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{rx.patientName || "—"}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{rx.patientId}</p>
                      </div>
                    </div>
                    {/* Diagnosis */}
                    <p className="text-sm text-gray-700 truncate">{rx.diagnosis || <span className="text-gray-300">—</span>}</p>
                    {/* Medications */}
                    <div className="space-y-0.5">
                      {rx.medications.slice(0, 2).map((m, i) => (
                        <p key={i} className="text-xs text-gray-600 truncate"><span className="font-medium">{m.name}</span> · {m.dosage}</p>
                      ))}
                      {rx.medications.length > 2 && <p className="text-xs text-gray-400">+{rx.medications.length - 2} more</p>}
                    </div>
                    {/* Issued */}
                    <p className="text-xs text-gray-500">{fmtDate(rx.issuedAt)}</p>
                    {/* Follow-up */}
                    <p className="text-xs text-gray-500">{rx.followUpDate ? fmtDate(rx.followUpDate) : <span className="text-gray-300">—</span>}</p>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewRx(rx)} title="View" className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-teal-100 text-gray-500 hover:text-teal-700 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => setDeleteId(rxId)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Patient View ─────────────────────────────────────────────────────────────

function getDoctorName(doctorId: Prescription["doctorId"]): string {
  if (typeof doctorId === "object" && doctorId?.name) return doctorId.name;
  return "Unknown Doctor";
}

function PatientPrescriptions() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);

  const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const printPrescription = (rx: Prescription) => {
    const doctorName = getDoctorName(rx.doctorId);
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Prescription – ${rx.diagnosis || "ezClinic"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; padding: 32px 40px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 18px; border-bottom: 2px solid #0d9488; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; color: #0d9488; letter-spacing: -0.5px; }
    .brand span { color: #134e4a; }
    .rx-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-top: 4px; }
    .rx-id { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .meta-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 4px; }
    .meta-value { font-size: 13px; font-weight: 600; color: #111827; }
    .meta-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
    .med-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .med-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; text-align: left; padding: 6px 10px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .med-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    .med-table tr:last-child td { border-bottom: none; }
    .med-num { width: 28px; text-align: center; font-weight: 700; color: #0d9488; }
    .med-name { font-weight: 600; color: #111827; }
    .notes-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; }
    .notes-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #d97706; margin-bottom: 6px; }
    .notes-text { font-size: 13px; color: #92400e; line-height: 1.6; }
    .followup-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; display: inline-block; }
    .followup-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0d9488; margin-bottom: 4px; }
    .followup-date { font-size: 14px; font-weight: 700; color: #134e4a; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-area { text-align: right; }
    .sig-line { width: 160px; border-bottom: 1px solid #9ca3af; margin-bottom: 4px; height: 32px; }
    .sig-label { font-size: 10px; color: #9ca3af; }
    .disclaimer { font-size: 10px; color: #9ca3af; max-width: 320px; line-height: 1.5; }
    @media print {
      body { padding: 20px 24px; }
      @page { margin: 1cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">ez<span>Clinic</span></div>
      <div class="rx-title">Medical Prescription</div>
    </div>
    <div style="text-align:right">
      <div class="rx-id">Issued: ${fmtDate(rx.issuedAt)}</div>
      ${rx._id || rx.id ? `<div class="rx-id" style="font-size:10px;color:#d1d5db">Ref: ${(rx._id || rx.id || "").slice(-8).toUpperCase()}</div>` : ""}
    </div>
  </div>

  <div class="meta-row">
    <div class="meta-box">
      <div class="meta-label">Prescribed by</div>
      <div class="meta-value">${doctorName}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Diagnosis / Condition</div>
      <div class="meta-value">${rx.diagnosis || "—"}</div>
    </div>
  </div>

  <div class="section-title">Medications</div>
  <table class="med-table">
    <thead>
      <tr>
        <th class="med-num">#</th>
        <th>Drug Name</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Duration</th>
      </tr>
    </thead>
    <tbody>
      ${rx.medications.map((m, i) => `
      <tr>
        <td class="med-num">${i + 1}</td>
        <td class="med-name">${m.name}</td>
        <td>${m.dosage}</td>
        <td>${m.frequency}</td>
        <td>${m.duration}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  ${rx.notes ? `
  <div class="section-title">Instructions / Notes</div>
  <div class="notes-box">
    <div class="notes-label">Clinical Notes</div>
    <div class="notes-text">${rx.notes}</div>
  </div>` : ""}

  ${rx.followUpDate ? `
  <div class="followup-box">
    <div class="followup-label">Follow-up Appointment</div>
    <div class="followup-date">${fmtDate(rx.followUpDate)}</div>
  </div>` : ""}

  <div class="footer">
    <div class="disclaimer">
      This is a digital prescription issued via ezClinic.<br/>
      Present this document to your pharmacist or at your next visit.
    </div>
    <div class="sig-area">
      <div class="sig-line"></div>
      <div class="sig-label">Doctor's Signature</div>
    </div>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const token = await getToken();
        const h = { Authorization: `Bearer ${token}` };

        const meRes = await fetch(`${PATIENT_API}/patients/me`, { headers: h });
        if (!meRes.ok) throw new Error("Could not load patient profile.");
        const me = await meRes.json();
        const patientId: string = me.id || me._id;

        const rxRes = await fetch(
          `${DOCTOR_API}/patients/${patientId}/prescriptions?page=${page}&limit=10`,
          { headers: h }
        );
        if (!rxRes.ok) throw new Error("Could not load prescriptions.");
        const rxData = await rxRes.json();

        if (!cancelled) {
          const items: Prescription[] = Array.isArray(rxData) ? rxData : rxData.data || [];
          setPrescriptions(items);
          if (rxData.pagination) {
            setTotalPages(rxData.pagination.totalPages || 1);
            setTotal(rxData.pagination.totalItems ?? items.length);
          } else {
            setTotal(items.length);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load prescriptions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [page]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* View prescription modal */}
      {viewRx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setViewRx(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-900">Prescription Details</h2>
                <p className="text-xs text-gray-400 mt-0.5">Issued by {getDoctorName(viewRx.doctorId)}</p>
              </div>
              <button
                onClick={() => setViewRx(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 text-lg transition-colors"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Doctor</p>
                  <p className="font-semibold text-gray-900">{getDoctorName(viewRx.doctorId)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Diagnosis</p>
                  <p className="font-semibold text-gray-900">{viewRx.diagnosis || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Issued</p>
                  <p className="font-semibold text-gray-900">{fmtDate(viewRx.issuedAt)}</p>
                </div>
                {viewRx.followUpDate && (
                  <div className="bg-teal-50 rounded-xl p-3">
                    <p className="text-xs text-teal-500 mb-1">Follow-up</p>
                    <p className="font-semibold text-teal-800">{fmtDate(viewRx.followUpDate)}</p>
                  </div>
                )}
              </div>

              {/* Medications */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Medications</p>
                <div className="space-y-2">
                  {viewRx.medications.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">{m.dosage} · {m.frequency} · {m.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {viewRx.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-600 mb-1">Notes</p>
                  <p className="text-sm text-amber-900">{viewRx.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => printPrescription(viewRx)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-white hover:border-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                </svg>
                Print
              </button>
              <button
                onClick={() => setViewRx(null)}
                className="px-5 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Prescriptions</h1>
            <p className="page-subtitle">
              {loading ? "Loading…" : `${total} prescription${total !== 1 ? "s" : ""} issued to you`}
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={() => setPage(1)}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="glass-card-premium">
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="empty-state-title">No prescriptions yet</div>
              <div className="empty-state-desc">Prescriptions issued by your doctor will appear here.</div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => {
              const rxId = rx._id || rx.id || "";
              const doctorName = getDoctorName(rx.doctorId);
              return (
                <div
                  key={rxId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-teal-200 transition-colors"
                >
                  {/* Left icon */}
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl shrink-0">
                    💊
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {rx.diagnosis || "Prescription"}
                      </span>
                      {rx.followUpDate && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium border border-teal-100">
                          Follow-up: {fmtDate(rx.followUpDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5">
                      By <span className="font-medium text-gray-700">{doctorName}</span>
                      {" · "}Issued {fmtDate(rx.issuedAt)}
                    </p>
                    {/* Medications preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {rx.medications.slice(0, 3).map((m, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium"
                        >
                          {m.name} {m.dosage}
                        </span>
                      ))}
                      {rx.medications.length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-400">
                          +{rx.medications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setViewRx(rx)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    <button
                      onClick={() => printPrescription(rx)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      title="Print prescription"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                      </svg>
                      Print
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-500 px-2">
              Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export default function PrescriptionPage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
      </div>
    );
  }

  const role = getUserRole(user);
  if (role === "patient") return <PatientPrescriptions />;
  return <DoctorPrescriptions />;
}
