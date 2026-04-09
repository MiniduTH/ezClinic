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
  { value: "both", label: "Both" },
  { value: "in-person", label: "In-Person" },
  { value: "telemedicine", label: "Telemedicine" },
];

const DAY_COLORS: Record<string, string> = {
  Monday: "from-blue-500 to-blue-600",
  Tuesday: "from-violet-500 to-purple-600",
  Wednesday: "from-emerald-500 to-green-600",
  Thursday: "from-amber-500 to-orange-500",
  Friday: "from-rose-500 to-pink-600",
  Saturday: "from-cyan-500 to-teal-600",
  Sunday: "from-gray-400 to-gray-500",
};

const DAY_BG: Record<string, string> = {
  Monday: "bg-blue-50 border-blue-200",
  Tuesday: "bg-violet-50 border-violet-200",
  Wednesday: "bg-emerald-50 border-emerald-200",
  Thursday: "bg-amber-50 border-amber-200",
  Friday: "bg-rose-50 border-rose-200",
  Saturday: "bg-cyan-50 border-cyan-200",
  Sunday: "bg-gray-50 border-gray-200",
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
  // TODO: Replace with actual doctor ID from Auth0 JWT once auth is wired up
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
      const res = await fetch(
        `${API_URL}/doctors/${doctorId}/availability`
      );
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
        res = await fetch(
          `${API_URL}/doctors/${doctorId}/availability`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editSlot),
          }
        );
      } else {
        res = await fetch(
          `${API_URL}/doctors/${doctorId}/availability/${editSlot.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editSlot),
          }
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error?.message || "Operation failed"
        );
      }

      showMessage(
        "success",
        modalMode === "add" ? "Slot added successfully!" : "Slot updated!"
      );
      setShowModal(false);
      await fetchSlots();
    } catch (err: any) {
      showMessage("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: string) => {
    if (!confirm("Delete this availability slot?")) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/doctors/${doctorId}/availability/${slotId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");

      showMessage("success", "Slot deleted.");
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch {
      showMessage("error", "Failed to delete slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (slot: Slot) => {
    try {
      const res = await fetch(
        `${API_URL}/doctors/${doctorId}/availability/${slot.id}/toggle`,
        { method: "PATCH" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error("Toggle failed");

      setSlots((prev) =>
        prev.map((s) =>
          s.id === slot.id
            ? { ...s, isActive: data.data.isActive }
            : s
        )
      );
      showMessage(
        "success",
        `Slot ${data.data.isActive ? "activated" : "deactivated"}.`
      );
    } catch {
      showMessage("error", "Failed to toggle slot.");
    }
  };

  // Group slots by day
  const grouped: Record<string, Slot[]> = {};
  for (const day of DAYS) {
    grouped[day] = slots.filter((s) => s.dayOfWeek === day);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Availability Schedule
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your weekly consultation hours. Patients will see active
            slots when booking.
          </p>
        </div>
        <div className="flex gap-2">
          {!fetched && (
            <button
              onClick={fetchSlots}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load Schedule"}
            </button>
          )}
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-blue-200 transition-all"
          >
            + Add Slot
          </button>
        </div>
      </div>

      {/* Message toast */}
      {message && (
        <div
          className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "✕"}</span>
          {message.text}
        </div>
      )}

      {/* Week grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DAYS.map((day) => (
          <div
            key={day}
            className={`rounded-xl border overflow-hidden ${DAY_BG[day]}`}
          >
            {/* Day header */}
            <div
              className={`px-4 py-3 bg-gradient-to-r ${DAY_COLORS[day]} flex items-center justify-between`}
            >
              <h3 className="font-semibold text-white text-sm">{day}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">
                  {grouped[day].length} slot
                  {grouped[day].length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => openAddModal(day)}
                  className="w-6 h-6 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-md text-xs transition-colors"
                  title={`Add slot for ${day}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Slots */}
            <div className="p-3 space-y-2 min-h-[80px]">
              {grouped[day].length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 italic">
                  No slots set
                </p>
              ) : (
                grouped[day].map((slot) => (
                  <div
                    key={slot.id}
                    className={`relative group p-3 rounded-lg bg-white border shadow-sm transition-all hover:shadow-md ${
                      slot.isActive
                        ? "border-gray-200"
                        : "border-gray-200 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        {!slot.isActive && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggle(slot)}
                          className={`w-6 h-6 flex items-center justify-center rounded text-xs transition-colors ${
                            slot.isActive
                              ? "hover:bg-amber-50 text-amber-600"
                              : "hover:bg-emerald-50 text-emerald-600"
                          }`}
                          title={
                            slot.isActive ? "Deactivate" : "Activate"
                          }
                        >
                          {slot.isActive ? "⏸" : "▶"}
                        </button>
                        <button
                          onClick={() => openEditModal(slot)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-blue-50 text-blue-600 rounded text-xs transition-colors"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => slot.id && handleDelete(slot.id)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-red-50 text-red-500 rounded text-xs transition-colors"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        {slot.consultationType === "in-person"
                          ? "🏥"
                          : slot.consultationType === "telemedicine"
                          ? "📹"
                          : "🏥📹"}{" "}
                        {slot.consultationType === "both"
                          ? "In-Person & Video"
                          : slot.consultationType === "in-person"
                          ? "In-Person"
                          : "Telemedicine"}
                      </span>
                      {slot.maxPatients > 1 && (
                        <span>👥 {slot.maxPatients} patients</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-emerald-600">
              <h2 className="text-lg font-semibold text-white">
                {modalMode === "add"
                  ? "Add Availability Slot"
                  : "Edit Availability Slot"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={editSlot.dayOfWeek}
                  onChange={(e) =>
                    setEditSlot((s) => ({
                      ...s,
                      dayOfWeek: e.target.value,
                    }))
                  }
                  disabled={modalMode === "edit"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm disabled:bg-gray-100"
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editSlot.startTime}
                    onChange={(e) =>
                      setEditSlot((s) => ({
                        ...s,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editSlot.endTime}
                    onChange={(e) =>
                      setEditSlot((s) => ({
                        ...s,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                </div>
              </div>

              {/* Consultation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Type
                </label>
                <div className="flex gap-2">
                  {CONSULTATION_TYPES.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() =>
                        setEditSlot((s) => ({
                          ...s,
                          consultationType: ct.value,
                        }))
                      }
                      className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        editSlot.consultationType === ct.value
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {ct.value === "in-person"
                        ? "🏥 "
                        : ct.value === "telemedicine"
                        ? "📹 "
                        : "🏥📹 "}
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Patients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Patients per Slot
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editSlot.maxPatients}
                  onChange={(e) =>
                    setEditSlot((s) => ({
                      ...s,
                      maxPatients: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-700">
                  Slot is active for booking
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditSlot((s) => ({
                      ...s,
                      isActive: !s.isActive,
                    }))
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    editSlot.isActive ? "bg-teal-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      editSlot.isActive ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 transition-all"
              >
                {loading
                  ? "Saving..."
                  : modalMode === "add"
                  ? "Add Slot"
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
