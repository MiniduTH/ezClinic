"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserRole } from "@/lib/roles";
import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";

const APPOINTMENT_API =
  process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:8080/api/v1";
const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";
const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  time: string;
  type: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  reason?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  consultationFee: number;
  consultationType?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    CONFIRMED: "bg-green-100 text-green-800 border-green-200",
    CANCELLED: "bg-red-100 text-red-800 border-red-200",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        map[status] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

// ─── Doctor View ──────────────────────────────────────────────────────────────

function DoctorAppointments({ accessToken }: { accessToken: string }) {
  const { user } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  // In production, doctorId should come from the authenticated user's profile on doctor-service
  const doctorId = (user as any)?.["https://ezclinic.com/doctorId"] || "69d71304d77fd0bbf5ec13eb";

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${APPOINTMENT_API}/appointments/doctor/${doctorId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to load appointments");
      const data = await res.json();
      const mapped = Array.isArray(data)
        ? data.map((a: any) => ({
            id: a.id || a._id,
            patientId: a.patientId,
            patientName: a.patientName || "Unknown Patient",
            doctorId: a.doctorId,
            date: a.date || a.appointmentDate,
            time: a.time || a.appointmentTime,
            type: a.type || a.consultationType || "Virtual",
            status: (a.status || "PENDING").toUpperCase(),
            reason: a.reason || a.issues,
          }))
        : [];
      setAppointments(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [doctorId, accessToken]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleAction = async (id: string, action: "confirm" | "cancel") => {
    try {
      await fetch(`${APPOINTMENT_API}/appointments/${id}/${action}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchAppointments();
    } catch {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: action === "confirm" ? "CONFIRMED" : "CANCELLED",
              }
            : a
        )
      );
    }
  };

  const filtered =
    filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your upcoming patient appointments
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
          No appointments found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {apt.patientName}
                  </span>
                  {statusBadge(apt.status)}
                </div>
                <div className="text-sm text-gray-500 space-x-3">
                  <span>📅 {apt.date}</span>
                  <span>🕐 {apt.time}</span>
                  <span>📍 {apt.type}</span>
                </div>
                {apt.reason && (
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    Reason: {apt.reason}
                  </p>
                )}
                {apt.type.toLowerCase() === "telemedicine" && (
                  <div className="mt-4">
                    <NotificationBanner appointmentId={apt.id} />
                  </div>
                )}
              </div>
              {apt.status === "PENDING" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(apt.id, "confirm")}
                    className="px-3 py-1.5 text-sm rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleAction(apt.id, "cancel")}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {apt.status === "CONFIRMED" && (
                <Link
                  href={`/telemedicine/${apt.id}`}
                  className="shrink-0 px-3 py-1.5 text-sm rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                >
                  📹 Start Session
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Patient View ─────────────────────────────────────────────────────────────

function PatientAppointments({ accessToken }: { accessToken: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [filter, setFilter] = useState("ALL");

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookReason, setBookReason] = useState("");
  const [bookType, setBookType] = useState("telemedicine");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };

      // Resolve patient identity
      const meRes = await fetch(`${PATIENT_API}/patients/me`, { headers });
      if (!meRes.ok) throw new Error("Could not load patient profile");
      const me = await meRes.json();
      setPatientId(me.id);

      // Fetch appointments
      const aptsRes = await fetch(
        `${APPOINTMENT_API}/appointments/patient/${me.id}`,
        { headers }
      );
      if (aptsRes.ok) {
        const data = await aptsRes.json();
        const mapped = Array.isArray(data)
          ? data.map((a: any) => ({
              id: a.id || a._id,
              patientId: a.patientId,
              doctorId: a.doctorId,
              doctorName: a.doctorName || "Unknown Doctor",
              date: a.date || a.appointmentDate,
              time: a.time || a.appointmentTime,
              type: a.type || a.consultationType || "Virtual",
              status: (a.status || "PENDING").toUpperCase(),
              reason: a.reason,
            }))
          : [];
        setAppointments(mapped);
      }

      // Fetch doctors for booking
      const docsRes = await fetch(`${DOCTOR_API}/doctors`, { headers });
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDoctors(Array.isArray(docsData) ? docsData : docsData.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !selectedDoctor || !bookDate || !bookTime) {
      setBookError("Please fill in all required fields.");
      return;
    }
    setBooking(true);
    setBookError("");
    try {
      const res = await fetch(`${APPOINTMENT_API}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctor,
          date: bookDate,
          time: bookTime,
          reason: bookReason,
          consultationType: bookType,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Booking failed");
      }
      setShowBooking(false);
      setSelectedDoctor("");
      setBookDate("");
      setBookTime("");
      setBookReason("");
      await fetchAll();
    } catch (err: any) {
      setBookError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await fetch(`${APPOINTMENT_API}/appointments/${id}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      await fetchAll();
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
    }
  };

  const filtered =
    filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean)));
  const filteredDoctors = specialtyFilter
    ? doctors.filter((d) => d.specialty === specialtyFilter)
    : doctors;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            My Appointments
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your consultations
          </p>
        </div>
        <button
          onClick={() => setShowBooking(true)}
          className="px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          + Book Appointment
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Book a Consultation</h2>
              <button
                onClick={() => { setShowBooking(false); setBookError(""); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBook} className="space-y-4">
              {/* Specialty filter for doctor search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Specialty
                </label>
                <select
                  value={specialtyFilter}
                  onChange={(e) => { setSpecialtyFilter(e.target.value); setSelectedDoctor(""); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Doctor <span className="text-red-500">*</span>
                </label>
                {filteredDoctors.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No doctors available.</p>
                ) : (
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Choose a doctor…</option>
                    {filteredDoctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.specialty}
                        {d.consultationFee ? ` (LKR ${d.consultationFee})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Type
                </label>
                <select
                  value={bookType}
                  onChange={(e) => setBookType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="telemedicine">Virtual (Video Call)</option>
                  <option value="in-person">In-Person (Clinic Visit)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason / Symptoms
                </label>
                <textarea
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for visit…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {bookError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {bookError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBooking(false); setBookError(""); }}
                  className="px-4 py-2 rounded-lg text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {booking ? "Booking…" : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-600" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
          <p className="text-lg font-medium">No appointments yet</p>
          <p className="mt-1 text-sm">
            Click{" "}
            <button
              onClick={() => setShowBooking(true)}
              className="text-teal-600 underline"
            >
              Book Appointment
            </button>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 truncate">
                    {apt.doctorName}
                  </span>
                  {statusBadge(apt.status)}
                </div>
                <div className="text-sm text-gray-500 space-x-3">
                  <span>📅 {apt.date}</span>
                  <span>🕐 {apt.time}</span>
                  <span>{apt.type === "telemedicine" ? "📹 Virtual" : "🏥 In-Person"}</span>
                </div>
                {apt.reason && (
                  <p className="mt-1 text-sm text-gray-600 truncate">
                    {apt.reason}
                  </p>
                )}
                {apt.type.toLowerCase() === "telemedicine" && (
                  <div className="mt-4">
                    <NotificationBanner appointmentId={apt.id} />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0 items-end">
                {apt.status === "CONFIRMED" && apt.type === "telemedicine" && (
                  <Link
                    href={`/telemedicine/${apt.id}`}
                    className="px-3 py-1.5 text-sm rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                  >
                    📹 Join Virtual Meeting
                  </Link>
                )}
                {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                  <button
                    onClick={() => handleCancel(apt.id)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const { user, isLoading } = useUser();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/token")
      .then((r) => r.json())
      .then((data) => setAccessToken(data.accessToken ?? null))
      .catch(() => setAccessToken(null))
      .finally(() => setTokenLoading(false));
  }, []);

  if (isLoading || tokenLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-gray-500">
        <p>
          Please{" "}
          <a href="/auth/login?returnTo=/appointments" className="text-teal-600 underline">
            log in
          </a>{" "}
          to view appointments.
        </p>
      </div>
    );
  }

  const role = getUserRole(user);

  if (role === "doctor") {
    return <DoctorAppointments accessToken={accessToken} />;
  }

  return <PatientAppointments accessToken={accessToken} />;
}
