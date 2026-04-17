"use client";

import { useState, useCallback, useEffect } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

async function getToken(): Promise<string> {
  const r = await fetch("/api/auth/token");
  if (!r.ok) throw new Error("Not authenticated");
  const { accessToken } = await r.json();
  return accessToken;
}

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const CONSULTATION_TYPES = [
  { value: "both",         label: "Hybrid",    icon: "⟡" },
  { value: "in-person",   label: "In-Person", icon: "🏥" },
  { value: "telemedicine", label: "Virtual",   icon: "📹" },
];

const DAY_META: Record<string, {
  short: string;
  accent: string;
  glow: string;
  badge: string;
  darkBadge: string;
}> = {
  Monday:    { short: "MON", accent: "from-sky-500 to-blue-600",       glow: "shadow-sky-500/25",     badge: "bg-sky-50 text-sky-700 border-sky-200",            darkBadge: "dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20" },
  Tuesday:   { short: "TUE", accent: "from-violet-500 to-purple-600",  glow: "shadow-violet-500/25",  badge: "bg-violet-50 text-violet-700 border-violet-200",   darkBadge: "dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20" },
  Wednesday: { short: "WED", accent: "from-emerald-500 to-teal-600",   glow: "shadow-emerald-500/25", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", darkBadge: "dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20" },
  Thursday:  { short: "THU", accent: "from-amber-500 to-orange-500",   glow: "shadow-amber-500/25",   badge: "bg-amber-50 text-amber-700 border-amber-200",       darkBadge: "dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" },
  Friday:    { short: "FRI", accent: "from-rose-500 to-pink-600",      glow: "shadow-rose-500/25",    badge: "bg-rose-50 text-rose-700 border-rose-200",           darkBadge: "dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20" },
  Saturday:  { short: "SAT", accent: "from-fuchsia-500 to-pink-500",   glow: "shadow-fuchsia-500/25", badge: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", darkBadge: "dark:bg-fuchsia-500/10 dark:text-fuchsia-300 dark:border-fuchsia-500/20" },
  Sunday:    { short: "SUN", accent: "from-slate-500 to-slate-600",    glow: "shadow-slate-500/25",   badge: "bg-slate-100 text-slate-600 border-slate-200",      darkBadge: "dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20" },
};

interface Slot {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  maxPatients: number;
  consultationType: string;
}

type ModalMode = "add" | "edit";

function calcDuration(start: string, end: string): string {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ""}` : `${m}m`;
}

export default function AvailabilityPage() {
  const [doctorId, setDoctorId]   = useState<string | null>(null);
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [loading, setLoading]     = useState(false);
  const [fetched, setFetched]     = useState(false);
  const [activeDay, setActiveDay] = useState<string>("Monday");
  const [message, setMessage]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editSlot, setEditSlot]   = useState<Slot>({
    dayOfWeek: "Monday", startTime: "09:00", endTime: "13:00",
    isActive: true, maxPatients: 1, consultationType: "both",
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/doctors/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data = json?.data ?? json;
        const id = data?._id ?? data?.id;
        if (id) setDoctorId(id);
      } catch { showMsg("error", "Could not resolve your doctor profile. Please re-login."); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSlots = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res  = await fetch(`${API_URL}/doctors/${encodeURIComponent(doctorId)}/availability`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setSlots((data.data.slots || []).map((s: any) => ({
          id: s.id ?? s._id,
          dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime,
          isActive: !!s.isActive,
          maxPatients: typeof s.maxPatients === "number" ? s.maxPatients : 1,
          consultationType: s.consultationType || "both",
        })));
      }
      setFetched(true);
    } catch { showMsg("error", "Failed to load availability slots."); }
    finally  { setLoading(false); }
  }, [doctorId]);

  const openAddModal = (day?: string) => {
    setModalMode("add");
    setEditSlot({ dayOfWeek: day || activeDay, startTime: "09:00", endTime: "13:00", isActive: true, maxPatients: 1, consultationType: "both" });
    setShowModal(true);
  };

  const openEditModal = (slot: Slot) => { setModalMode("edit"); setEditSlot({ ...slot }); setShowModal(true); };

  const handleSave = async () => {
    if (!doctorId) return;
    if (editSlot.startTime >= editSlot.endTime) { showMsg("error", "Start time must be before end time."); return; }
    setLoading(true);
    try {
      const token   = await getToken();
      const payload = { dayOfWeek: editSlot.dayOfWeek, startTime: editSlot.startTime, endTime: editSlot.endTime, isActive: editSlot.isActive, maxPatients: editSlot.maxPatients, consultationType: editSlot.consultationType };
      const url     = modalMode === "add"
        ? `${API_URL}/doctors/${encodeURIComponent(doctorId)}/availability`
        : `${API_URL}/doctors/${encodeURIComponent(doctorId)}/availability/${editSlot.id}`;
      const res     = await fetch(url, { method: modalMode === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const data    = await res.json();
      if (!res.ok) throw new Error(data?.message || "Operation failed");
      showMsg("success", modalMode === "add" ? "Slot added successfully" : "Slot updated successfully");
      setShowModal(false);
      await fetchSlots();
    } catch (err) { showMsg("error", err instanceof Error ? err.message : "An error occurred"); }
    finally        { setLoading(false); }
  };

  const handleDelete = async (slotId: string) => {
    if (!doctorId || !confirm("Delete this slot permanently?")) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch(`${API_URL}/doctors/${encodeURIComponent(doctorId)}/availability/${slotId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok && res.status !== 204) throw new Error();
      showMsg("success", "Slot removed successfully");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch { showMsg("error", "Failed to delete slot."); }
    finally  { setLoading(false); }
  };

  const handleToggle = async (slot: Slot) => {
    if (!doctorId) return;
    try {
      const token = await getToken();
      const res   = await fetch(`${API_URL}/doctors/${encodeURIComponent(doctorId)}/availability/${slot.id}/toggle`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const data  = await res.json();
      if (!res.ok) throw new Error();
      setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, isActive: data.data.isActive } : s)));
      showMsg("success", `Slot ${data.data.isActive ? "activated" : "deactivated"}`);
    } catch { showMsg("error", "Failed to toggle slot."); }
  };

  const grouped: Record<string, Slot[]> = {};
  for (const day of DAYS) grouped[day] = slots.filter((s) => s.dayOfWeek === day);

  const totalActive    = slots.filter((s) => s.isActive).length;
  const activeDaySlots = grouped[activeDay] || [];
  const meta           = DAY_META[activeDay];

  const inputCls = "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/8 rounded-2xl px-4 py-3 text-slate-800 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/50 transition-all";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col transition-colors duration-300">

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <div>
            <h1 className="text-slate-900 dark:text-white font-bold text-lg leading-none tracking-tight">Schedule Manager</h1>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 font-medium">Weekly Availability</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">{totalActive} Active Slots</span>
          </div>

          {!fetched ? (
            <button onClick={fetchSlots} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-800 dark:hover:text-white transition-all disabled:opacity-50">
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
              {loading ? "Loading…" : "Load Schedule"}
            </button>
          ) : (
            <button onClick={fetchSlots} disabled={loading} title="Refresh"
              className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5 rounded-xl hover:text-slate-700 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/15 transition-all">
              <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
              </svg>
            </button>
          )}

          <button onClick={() => openAddModal()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-px transition-all active:translate-y-0">
            <span className="text-base leading-none">+</span> New Slot
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Day Sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-white/5 bg-slate-100/60 dark:bg-slate-900/40 flex flex-col py-6 gap-1 px-3 transition-colors duration-300">
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Days of Week</p>

          {DAYS.map((day) => {
            const isSelected = day === activeDay;
            const count = grouped[day]?.length ?? 0;
            const m = DAY_META[day];
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                className={`group relative flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? "bg-white dark:bg-white/8 shadow-sm ring-1 ring-slate-200 dark:ring-white/10"
                    : "hover:bg-white/70 dark:hover:bg-white/4"
                }`}>
                {isSelected && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b ${m.accent}`} />
                )}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black tracking-wider transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${m.accent} text-white shadow-lg ${m.glow}`
                      : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500 group-hover:bg-slate-300 dark:group-hover:bg-white/8"
                  }`}>
                    {m.short}
                  </div>
                  <span className={`font-semibold text-sm transition-colors ${
                    isSelected ? "text-slate-800 dark:text-white" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                  }`}>
                    {day}
                  </span>
                </div>
                {count > 0 && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${m.accent} text-white shadow-sm`
                      : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Weekly stats */}
          <div className="mt-auto pt-6 px-1">
            <div className="p-4 rounded-2xl bg-white dark:bg-white/3 border border-slate-200 dark:border-white/5 shadow-sm">
              <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-3">This Week</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5">
                  <p className="text-slate-800 dark:text-white font-bold text-lg leading-none">{slots.length}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-1">Total</p>
                </div>
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5">
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg leading-none">{totalActive}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-semibold mt-1">Active</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

          {/* Day Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.accent} flex items-center justify-center shadow-xl ${meta.glow}`}>
                <span className="text-white font-black text-xs tracking-wider">{meta.short}</span>
              </div>
              <div>
                <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">{activeDay}</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">
                  {activeDaySlots.length === 0
                    ? "No slots scheduled · Add your first slot below"
                    : `${activeDaySlots.filter(s => s.isActive).length} active · ${activeDaySlots.filter(s => !s.isActive).length} paused`}
                </p>
              </div>
            </div>
            <button onClick={() => openAddModal(activeDay)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-2xl bg-gradient-to-br ${meta.accent} text-white shadow-xl ${meta.glow} hover:opacity-90 hover:-translate-y-px transition-all active:translate-y-0`}>
              <span className="text-lg leading-none">+</span> Add Slot
            </button>
          </div>

          {/* Empty State */}
          {activeDaySlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/8 bg-white dark:bg-white/2 transition-colors">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${meta.accent} flex items-center justify-center mb-5 opacity-25 shadow-2xl`}>
                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/>
                </svg>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">No availability for {activeDay}</p>
              <p className="text-slate-400 dark:text-slate-600 text-sm mt-1 font-medium">Create your first slot to start accepting appointments</p>
              <button onClick={() => openAddModal(activeDay)}
                className={`mt-6 px-6 py-3 rounded-2xl bg-gradient-to-br ${meta.accent} text-white text-sm font-bold shadow-lg hover:opacity-90 transition-all`}>
                Create First Slot
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDaySlots.map((slot) => {
                const typeInfo = CONSULTATION_TYPES.find((c) => c.value === slot.consultationType);
                return (
                  <div key={slot.id}
                    className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden ${
                      slot.isActive
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/15 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl shadow-sm"
                        : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/4 opacity-60 hover:opacity-80"
                    }`}>
                    <div className={`h-1 w-full bg-gradient-to-r ${meta.accent} ${!slot.isActive ? "opacity-30" : ""}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">{slot.startTime}</span>
                            <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            <span className="text-slate-600 dark:text-slate-300 font-bold text-2xl tracking-tight">{slot.endTime}</span>
                          </div>
                          <p className="text-slate-400 dark:text-slate-600 text-xs font-medium mt-1">{calcDuration(slot.startTime, slot.endTime)}</p>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                          slot.isActive
                            ? "bg-emerald-500 dark:bg-emerald-400 shadow-lg shadow-emerald-400/40 animate-pulse"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`} />
                      </div>

                      <div className="flex flex-wrap gap-2 mb-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${meta.badge} ${meta.darkBadge}`}>
                          {typeInfo?.icon} {typeInfo?.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          {slot.maxPatients} {slot.maxPatients === 1 ? "Patient" : "Patients"}
                        </span>
                        {!slot.isActive && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                        <button onClick={() => handleToggle(slot)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                            slot.isActive
                              ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/8 hover:bg-amber-100 dark:hover:bg-amber-400/15 border border-amber-200 dark:border-amber-400/20"
                              : "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/8 hover:bg-emerald-100 dark:hover:bg-emerald-400/15 border border-emerald-200 dark:border-emerald-400/20"
                          }`}>
                          {slot.isActive ? "⏸ Pause" : "▶ Activate"}
                        </button>
                        <button onClick={() => openEditModal(slot)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-400/8 hover:bg-blue-100 dark:hover:bg-blue-400/15 border border-blue-200 dark:border-blue-400/20 transition-all">
                          ✎ Edit
                        </button>
                        <button onClick={() => slot.id && handleDelete(slot.id)} title="Delete"
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 border border-slate-200 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-400/20 transition-all text-sm">
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add ghost card */}
              <button onClick={() => openAddModal(activeDay)}
                className="group rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/8 bg-transparent hover:bg-white dark:hover:bg-white/3 hover:border-slate-300 dark:hover:border-white/15 transition-all min-h-[200px] flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 hover:shadow-sm">
                <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 group-hover:border-slate-400 dark:group-hover:border-slate-500 flex items-center justify-center text-2xl transition-all group-hover:scale-110">+</div>
                <span className="text-sm font-semibold">Add Slot</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {message && (
        <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl text-sm font-semibold backdrop-blur-xl animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)] ${
          message.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
            : "bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300"
        }`}>
          <div className={`w-2 h-2 rounded-full ${message.type === "success" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"}`} />
          {message.text}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30 dark:bg-black/70 backdrop-blur-lg" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.5)] overflow-hidden animate-[scaleUp_0.35s_cubic-bezier(0.16,1,0.3,1)] transition-colors">
            <div className={`h-1 bg-gradient-to-r ${DAY_META[editSlot.dayOfWeek]?.accent || "from-blue-500 to-indigo-600"}`} />

            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-white/5">
              <div>
                <h2 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
                  {modalMode === "add" ? "Add New Slot" : "Edit Slot"}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-0.5">
                  {modalMode === "add" ? "Configure your availability window" : "Modify slot configuration"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white transition-all flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="p-7 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Day</label>
                <select value={editSlot.dayOfWeek}
                  onChange={(e) => setEditSlot((s) => ({ ...s, dayOfWeek: e.target.value }))}
                  disabled={modalMode === "edit"}
                  className={`${inputCls} appearance-none disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Start Time</label>
                  <input type="time" value={editSlot.startTime}
                    onChange={(e) => setEditSlot((s) => ({ ...s, startTime: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">End Time</label>
                  <input type="time" value={editSlot.endTime}
                    onChange={(e) => setEditSlot((s) => ({ ...s, endTime: e.target.value }))}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Consultation Type</label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-white/5">
                  {CONSULTATION_TYPES.map((ct) => (
                    <button key={ct.value} type="button"
                      onClick={() => setEditSlot((s) => ({ ...s, consultationType: ct.value }))}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        editSlot.consultationType === ct.value
                          ? "bg-white dark:bg-white/12 text-blue-600 dark:text-white border border-slate-200 dark:border-white/15 shadow-sm"
                          : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5"
                      }`}>
                      <span className="block text-base mb-1">{ct.icon}</span>
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Patient Cap</label>
                  <input type="number" min={1} max={100} value={editSlot.maxPatients}
                    onChange={(e) => setEditSlot((s) => ({ ...s, maxPatients: parseInt(e.target.value) || 1 }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                  <button type="button"
                    onClick={() => setEditSlot((s) => ({ ...s, isActive: !s.isActive }))}
                    className={`w-full h-[46px] rounded-2xl border font-bold text-sm transition-all ${
                      editSlot.isActive
                        ? "bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/8 text-slate-400 dark:text-slate-500"
                    }`}>
                    {editSlot.isActive ? "● Active" : "○ Inactive"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-7 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-transparent">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-white/4 hover:bg-slate-200 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-white/5 transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className={`flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${DAY_META[editSlot.dayOfWeek]?.accent || "from-blue-600 to-indigo-600"} shadow-lg transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0`}>
                {loading ? "Saving…" : modalMode === "add" ? "Create Slot" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
