"use client";

import { useState, useCallback } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

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
  { value: "both", label: "Hybrid", icon: "🏥📹" },
  { value: "in-person", label: "In-Person", icon: "🏥" },
  { value: "telemedicine", label: "Virtual", icon: "📹" },
];

const DAY_COLORS: Record<string, string> = {
  Monday: "from-blue-100 to-indigo-50 border-blue-200 text-blue-900",
  Tuesday: "from-violet-100 to-purple-50 border-violet-200 text-violet-900",
  Wednesday: "from-emerald-100 to-teal-50 border-emerald-200 text-emerald-900",
  Thursday: "from-amber-100 to-orange-50 border-amber-200 text-amber-900",
  Friday: "from-rose-100 to-pink-50 border-rose-200 text-rose-900",
  Saturday: "from-fuchsia-100 to-fuchsia-50 border-fuchsia-200 text-fuchsia-900",
  Sunday: "from-slate-100 to-gray-50 border-slate-200 text-slate-900",
};

const DAY_HEADER_COLORS: Record<string, string> = {
  Monday: "bg-blue-600",
  Tuesday: "bg-violet-600",
  Wednesday: "bg-emerald-600",
  Thursday: "bg-amber-500",
  Friday: "bg-rose-500",
  Saturday: "bg-fuchsia-600",
  Sunday: "bg-slate-600",
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

export default function AvailabilityPage() {
  const doctorId = "69d71304d77fd0bbf5ec13eb";

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editSlot, setEditSlot] = useState<Slot>({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "13:00",
    isActive: true,
    maxPatients: 1,
    consultationType: "both",
  });

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability`);
      const data = await res.json();
      if (data.success) {
        setSlots(data.data.slots || []);
      }
      setFetched(true);
    } catch {
      showMessage("error", "Failed to load availability slots.");
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const openAddModal = (day?: string) => {
    setModalMode("add");
    setEditSlot({
      dayOfWeek: day || "Monday",
      startTime: "09:00",
      endTime: "13:00",
      isActive: true,
      maxPatients: 1,
      consultationType: "both",
    });
    setShowModal(true);
  };

  const openEditModal = (slot: Slot) => {
    setModalMode("edit");
    setEditSlot({ ...slot });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editSlot.startTime >= editSlot.endTime) {
      showMessage("error", "Start time must be before end time.");
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      if (modalMode === "add") {
        res = await fetch(`${API_URL}/doctors/${doctorId}/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editSlot),
        });
      } else {
        res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${editSlot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editSlot),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error?.message || "Operation failed");
      }

      showMessage("success", modalMode === "add" ? "Slot added seamlessly ✨" : "Slot updated! 🚀");
      setShowModal(false);
      await fetchSlots();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Are you sure you want to permanently delete this slot?")) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${slotId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");

      showMessage("success", "Time slot removed. 🧹");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      showMessage("error", "Failed to delete slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (slot: Slot) => {
    try {
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${slot.id}/toggle`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Toggle failed");

      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, isActive: data.data.isActive } : s))
      );
      showMessage("success", `Slot successfully ${data.data.isActive ? "activated" : "paused"}. 💫`);
    } catch {
      showMessage("error", "Failed to toggle slot.");
    }
  };

  const grouped: Record<string, Slot[]> = {};
  for (const day of DAYS) {
    grouped[day] = slots.filter((s) => s.dayOfWeek === day);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-6 relative overflow-hidden font-sans">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/20 blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-slate-200/60 p-8 rounded-[2rem] shadow-sm transition-all hover:shadow-md">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Master Schedule
            </h1>
            <p className="text-slate-500 mt-2 font-medium tracking-wide">
              Architect your weekly capacity. Patients adapt to this pulse.
            </p>
          </div>
          <div className="flex gap-4">
            {!fetched && (
              <button
                onClick={fetchSlots}
                disabled={loading}
                className="group relative px-6 py-3 font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <span className="relative flex items-center gap-2">
                  {loading ? "Syncing..." : "⚡ Sync Schedule"}
                </span>
              </button>
            )}
            <button
              onClick={() => openAddModal()}
              className="px-6 py-3 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all active:translate-y-0"
            >
              + Ignite New Slot
            </button>
          </div>
        </header>

        {/* Message Toast (Floating) */}
        {message && (
          <div
            className={`fixed bottom-10 inset-x-0 mx-auto w-max px-6 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border z-50 flex items-center gap-3 animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span className="text-xl">{message.type === "success" ? "✨" : "💥"}</span>
            <span className="font-medium tracking-wide">{message.text}</span>
          </div>
        )}

        {/* Week Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DAYS.map((day) => (
            <div
              key={day}
              className={`group flex flex-col bg-gradient-to-b ${DAY_COLORS[day]} border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              {/* Day Header */}
              <div
                className={`px-5 py-4 ${DAY_HEADER_COLORS[day]} flex items-center justify-between shadow-sm`}
              >
                <h3 className="font-bold text-white tracking-widest uppercase text-sm drop-shadow-sm">
                  {day}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold bg-black/10 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    {grouped[day].length} {grouped[day].length === 1 ? "Slot" : "Slots"}
                  </span>
                  <button
                    onClick={() => openAddModal(day)}
                    className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-xl text-lg transition-all hover:scale-110 active:scale-95 shadow-sm"
                    title={`Add slot to ${day}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Slots Container */}
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                {grouped[day].length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-400 text-center">
                    <div className="w-12 h-12 mb-3 rounded-2xl bg-white/50 flex items-center justify-center border border-slate-200 shadow-sm text-lg">
                      💤
                    </div>
                    <p className="text-sm font-medium">Silent Period</p>
                  </div>
                ) : (
                  grouped[day].map((slot) => (
                    <div
                      key={slot.id}
                      className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-300 group/slot shadow-sm ${
                        slot.isActive
                          ? "bg-white border-white hover:border-slate-300 hover:shadow-xl hover:-translate-y-1"
                          : "bg-white/50 border-transparent opacity-70 hover:opacity-100 grayscale-[0.3]"
                      }`}
                    >
                      {/* Interactive Blob */}
                      {slot.isActive && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent rounded-full blur-xl pointer-events-none group-hover/slot:opacity-100 opacity-0 transition-opacity" />
                      )}

                      <div className="flex items-start justify-between relative z-10">
                        <div>
                          <p className="text-[17px] font-bold tracking-tight text-slate-800">
                            {slot.startTime} <span className="text-slate-400 mx-1">→</span> {slot.endTime}
                          </p>
                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 border border-slate-200 rounded-lg text-slate-600 shadow-sm">
                              {CONSULTATION_TYPES.find((c) => c.value === slot.consultationType)?.icon}{" "}
                              {CONSULTATION_TYPES.find((c) => c.value === slot.consultationType)?.label}
                            </span>
                            {slot.maxPatients > 1 && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg shadow-sm">
                                👥 {slot.maxPatients} Cap
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions Matrix */}
                        <div className="flex flex-col gap-1.5 opacity-0 group-hover/slot:opacity-100 transition-all translate-x-2 group-hover/slot:translate-x-0">
                          <button
                            onClick={() => handleToggle(slot)}
                            className={`w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:scale-110 transition-all ${
                              slot.isActive
                                ? "hover:bg-amber-100 hover:border-amber-300 hover:text-amber-700 text-slate-400"
                                : "hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-700 text-slate-400"
                            }`}
                            title={slot.isActive ? "Pause Slot" : "Revive Slot"}
                          >
                            {slot.isActive ? "⏸" : "▶"}
                          </button>
                          <button
                            onClick={() => openEditModal(slot)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-700 text-slate-400 hover:scale-110 transition-all"
                            title="Refine Slot"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => slot.id && handleDelete(slot.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-700 text-slate-400 hover:scale-110 transition-all"
                            title="Annihilate Slot"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {!slot.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px] bg-slate-100/40 pointer-events-none rounded-2xl">
                          <span className="px-3 py-1 bg-white text-slate-500 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full border border-slate-300 shadow-sm">
                            Dormant
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cinematic Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-md transition-opacity animate-[fadeIn_0.3s_ease-out]"
              onClick={() => setShowModal(false)}
            />

            <div className="relative bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-lg overflow-hidden animate-[scaleUp_0.4s_cubic-bezier(0.16,1,0.3,1)]">
              {/* Modal Glow */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {modalMode === "add" ? "Sculpt New Slot" : "Refine Slot Metrics"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="p-8 space-y-7">
                {/* Day selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    Target Day
                  </label>
                  <select
                    value={editSlot.dayOfWeek}
                    onChange={(e) => setEditSlot((s) => ({ ...s, dayOfWeek: e.target.value }))}
                    disabled={modalMode === "edit"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none disabled:opacity-50 disabled:bg-slate-100 shadow-sm"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horizon Times */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Commencement
                    </label>
                    <input
                      type="time"
                      value={editSlot.startTime}
                      onChange={(e) => setEditSlot((s) => ({ ...s, startTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Conclusion
                    </label>
                    <input
                      type="time"
                      value={editSlot.endTime}
                      onChange={(e) => setEditSlot((s) => ({ ...s, endTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Type & Cap */}
                <div className="grid grid-cols-5 gap-5">
                  <div className="col-span-3 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Modality
                    </label>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                      {CONSULTATION_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => setEditSlot((s) => ({ ...s, consultationType: ct.value }))}
                          className={`flex-1 py-2 text-[11px] font-bold tracking-wide rounded-xl transition-all duration-300 ${
                            editSlot.consultationType === ct.value
                              ? "bg-white text-blue-700 shadow-md border border-slate-200"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                          }`}
                        >
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                      Patient Cap
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editSlot.maxPatients}
                      onChange={(e) =>
                        setEditSlot((s) => ({ ...s, maxPatients: parseInt(e.target.value) || 1 }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="font-bold text-slate-800 text-[15px]">Slot Activity</p>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium">Will patients see this slot?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditSlot((s) => ({ ...s, isActive: !s.isActive }))}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 shadow-inner ${
                      editSlot.isActive ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                        editSlot.isActive ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[2rem]">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3.5 text-sm font-bold tracking-wide text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-8 py-3.5 text-sm font-bold tracking-wide text-white bg-slate-900 border border-slate-800 rounded-xl transition-all shadow-lg shadow-black/10 hover:shadow-black/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? "Materializing..." : modalMode === "add" ? "Forge Entry" : "Commit Mutation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
