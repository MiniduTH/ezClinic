"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function DoctorDashboard() {
  const { user } = useUser();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const APPOINTMENT_API =
    process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:8080/api/v1";
  const DOCTOR_API_URL =
    process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

  const doctorName = (user as any)?.name || "Doctor";

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Not authenticated");
        const { accessToken } = await tokenRes.json();

        const res = await fetch(`${APPOINTMENT_API}/appointments/doctor`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const json = await res.json();

        const data = json.data?.content || json.data || [];
        const liveAppointments = Array.isArray(data)
          ? data.map((apt: Record<string, unknown>) => ({
              id: apt.id || apt._id || "N/A",
              patientId: apt.patientId || "Unknown",
              patientName: apt.patientName || apt.patientId || "Patient",
              time: apt.startTime || apt.time || "TBD",
              date: apt.appointmentDate || apt.date || "TBD",
              type: apt.type || "IN_PERSON",
              status: apt.status || "PENDING",
              notes: apt.notes || "",
            }))
          : [];

        setAppointments(liveAppointments);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [APPOINTMENT_API]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) return;
      const { accessToken } = await tokenRes.json();

      const res = await fetch(
        `${APPOINTMENT_API}/appointments/${id}/status?status=${status}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!res.ok) throw new Error("Failed");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch {
      alert("Failed to update appointment status.");
    }
  };

  const joinVideoCall = async (appointmentId: string) => {
    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) return;
      const { accessToken } = await tokenRes.json();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_TELEMEDICINE_API || "http://localhost:8090/api/v1"}/sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ appointmentId }),
        }
      );
      if (res.ok) {
        const session = await res.json();
        window.open(session.jitsiUrl || session.data?.jitsiUrl, "_blank");
      } else {
        alert("Could not create session. Try again.");
      }
    } catch {
      alert("Telemedicine service unavailable.");
    }
  };

  const viewReports = (patientId: string) => {
    alert(`Patient ID: ${patientId}\nFetching from Patient Service…`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 relative font-sans overflow-hidden">
      {/* Light modern blurs for premium UI */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-400/20 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10 p-4">

        {/* Dashboard Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-slate-900">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{doctorName}</span>
            </h1>
            <p className="text-slate-500 mt-2 font-semibold tracking-wide text-sm">
              Your Command Center overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/availability" className="px-5 py-2.5 font-bold text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md hover:shadow-lg">
              Manage Schedule
            </Link>
            <Link href="/prescriptions" className="px-5 py-2.5 font-bold text-xs uppercase tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl transition-all shadow-sm">
              Issue Prescription
            </Link>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Requests</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{appointments.filter(a => a.status === "Pending").length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-xl">⏳</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Today&apos;s Virtual</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{appointments.filter(a => a.type === "Virtual" && a.status === "Accepted").length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl">📹</div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patients Processed</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">1,204</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl">✓</div>
          </div>
        </div>

        {/* Action Grid (Appointments) */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6">Patient Queue & Operations</h2>
          <div className="grid grid-cols-1 gap-5">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center uppercase font-extrabold text-xl text-slate-400 border border-slate-200 shadow-inner">
                    {apt.patientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{apt.patientName}</h3>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${apt.type === 'Virtual' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {apt.type}
                      </span>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg ${apt.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{apt.date} at {apt.time} • <span className="italic">&ldquo;{apt.issues}&rdquo;</span></p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {apt.status === "Pending" ? (
                    <>
                      <button onClick={() => updateStatus(apt.id, "CANCELLED")} className="px-5 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-xl transition-colors">
                        Decline
                      </button>
                      <button onClick={() => updateStatus(apt.id, "CONFIRMED")} className="px-5 py-2 text-xs font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 rounded-xl transition-all">
                        Accept Booking
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => viewReports(apt.patientId)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5">
                        📄 Reports
                      </button>

                      {apt.type === "VIRTUAL" && (
                        <button onClick={() => joinVideoCall(apt.id)} className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5">
                          📹 Start Session
                        </button>
                      )}

                      <Link href={`/prescriptions?patientId=${apt.patientId}&appointmentId=${apt.id}`} className="px-4 py-2 text-xs font-bold text-white bg-slate-900 shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 rounded-xl transition-all flex items-center gap-1.5">
                        + Issue Rx
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
