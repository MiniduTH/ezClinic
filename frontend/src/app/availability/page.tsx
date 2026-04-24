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
  { value: "both", label: "Hybrid" },
  { value: "in-person", label: "In-Person" },
  { value: "telemedicine", label: "Virtual" },
];

const IS_WEEKEND: Record<string, boolean> = {
  Monday: false,
  Tuesday: false,
  Wednesday: false,
  Thursday: false,
  Friday: false,
  Saturday: true,
  Sunday: true,
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
  const [doctorId, setDoctorId] = useState<string | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not load doctor profile");
        const data = await res.json();
        const id = data?.data?._id ?? data?.data?.id ?? data?._id ?? data?.id;
        if (id) setDoctorId(id);
      } catch {
        showMessage("error", "Could not resolve your doctor profile. Please re-login.");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchSlots = useCallback(async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSlots(
          (data.data.slots || []).map((s: any) => ({
            id: s.id ?? s._id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: !!s.isActive,
            maxPatients: typeof s.maxPatients === "number" ? s.maxPatients : 1,
            consultationType: s.consultationType || "both",
          }))
        );
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
    if (!doctorId) return;
    if (editSlot.startTime >= editSlot.endTime) {
      showMessage("error", "Start time must be before end time.");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      let res: Response;
      const payload = {
        dayOfWeek: editSlot.dayOfWeek,
        startTime: editSlot.startTime,
        endTime: editSlot.endTime,
        isActive: editSlot.isActive,
        maxPatients: editSlot.maxPatients,
        consultationType: editSlot.consultationType,
      };

      if (modalMode === "add") {
        res = await fetch(`${API_URL}/doctors/${doctorId}/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${editSlot.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || data?.error?.message || "Operation failed");
      }

      showMessage("success", modalMode === "add" ? "Time slot added successfully." : "Time slot updated.");
      setShowModal(false);
      await fetchSlots();
    } catch (err) {
      showMessage("error", err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!doctorId) return;
    if (!confirm("Are you sure you want to delete this time slot?")) return;

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${slotId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");

      showMessage("success", "Time slot removed.");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      showMessage("error", "Failed to delete slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (slot: Slot) => {
    if (!doctorId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/doctors/${doctorId}/availability/${slot.id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Toggle failed");

      setSlots((prev) =>
        prev.map((s) => (s.id === slot.id ? { ...s, isActive: data.data.isActive } : s))
      );
      showMessage("success", `Slot ${data.data.isActive ? "activated" : "paused"} successfully.`);
    } catch {
      showMessage("error", "Failed to update slot status.");
    }
  };

  const grouped: Record<string, Slot[]> = {};
  for (const day of DAYS) {
    grouped[day] = slots.filter((s) => s.dayOfWeek === day);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Availability Schedule</h1>
            <p className="page-subtitle">
              Define your weekly consultation hours and manage patient appointment slots.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {!fetched && (
              <button onClick={fetchSlots} disabled={loading} className="btn-ghost">
                {loading ? "Loading..." : "Load Schedule"}
              </button>
            )}
            <button onClick={() => openAddModal()} className="btn-gradient">
              + Add Time Slot
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {message && (
          <div
            className={`fixed bottom-10 inset-x-0 mx-auto w-max px-5 py-3 rounded-xl shadow-lg border z-50 flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Weekly Schedule Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS.map((day) => (
            <div
              key={day}
              className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Day Header */}
              <div
                className={`px-4 py-3 ${IS_WEEKEND[day] ? "bg-slate-600" : "bg-teal-700"} flex items-center justify-between`}
              >
                <h3 className="font-semibold text-white text-sm tracking-wide">{day}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-white/20 text-white px-2 py-0.5 rounded-md">
                    {grouped[day].length} {grouped[day].length === 1 ? "slot" : "slots"}
                  </span>
                  <button
                    onClick={() => openAddModal(day)}
                    className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-all"
                    title={`Add slot for ${day}`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Slots List */}
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                {grouped[day].length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-8 h-8 mb-2 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-slate-400">No slots scheduled</p>
                  </div>
                ) : (
                  grouped[day].map((slot) => (
                    <div
                      key={slot.id}
                      className={`relative p-3 rounded-xl border transition-all group/slot ${
                        slot.isActive
                          ? "bg-white border-slate-200 hover:border-teal-200 hover:shadow-sm"
                          : "bg-slate-50 border-slate-100 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {slot.startTime} – {slot.endTime}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100 border border-slate-200 rounded-md text-slate-600">
                              {CONSULTATION_TYPES.find((c) => c.value === slot.consultationType)?.label}
                            </span>
                            {slot.maxPatients > 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-teal-50 border border-teal-100 text-teal-700 rounded-md">
                                {slot.maxPatients} patients
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggle(slot)}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs transition-all ${
                              slot.isActive
                                ? "bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-slate-400"
                                : "bg-white border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-slate-400"
                            }`}
                            title={slot.isActive ? "Pause slot" : "Activate slot"}
                          >
                            {slot.isActive ? "⏸" : "▶"}
                          </button>
                          <button
                            onClick={() => openEditModal(slot)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 text-slate-400 text-xs transition-all"
                            title="Edit slot"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => slot.id && handleDelete(slot.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 text-base transition-all"
                            title="Delete slot"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {!slot.isActive && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
                          <span className="px-2.5 py-0.5 bg-white text-slate-500 text-[9px] font-bold uppercase tracking-widest rounded-full border border-slate-200 shadow-sm">
                            Paused
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

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />

            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-teal-600 rounded-t-2xl" />

              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">
                  {modalMode === "add" ? "Add New Slot" : "Edit Slot"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Day */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Day
                  </label>
                  <select
                    value={editSlot.dayOfWeek}
                    onChange={(e) => setEditSlot((s) => ({ ...s, dayOfWeek: e.target.value }))}
                    disabled={modalMode === "edit"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all appearance-none disabled:opacity-50 disabled:bg-slate-100"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Start & End Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={editSlot.startTime}
                      onChange={(e) => setEditSlot((s) => ({ ...s, startTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={editSlot.endTime}
                      onChange={(e) => setEditSlot((s) => ({ ...s, endTime: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                {/* Consultation Type & Max Patients */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="col-span-3 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Consultation Type
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {CONSULTATION_TYPES.map((ct) => (
                        <button
                          key={ct.value}
                          type="button"
                          onClick={() => setEditSlot((s) => ({ ...s, consultationType: ct.value }))}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            editSlot.consultationType === ct.value
                              ? "bg-white text-teal-700 shadow-sm border border-slate-200"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          {ct.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Max Patients
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editSlot.maxPatients}
                      onChange={(e) =>
                        setEditSlot((s) => ({ ...s, maxPatients: parseInt(e.target.value) || 1 }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Active</p>
                    <p className="text-xs text-slate-500 mt-0.5">Make this slot visible to patients</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditSlot((s) => ({ ...s, isActive: !s.isActive }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                      editSlot.isActive ? "bg-teal-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                        editSlot.isActive ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : modalMode === "add" ? "Add Slot" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
