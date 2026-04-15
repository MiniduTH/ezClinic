"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Stethoscope, Star, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";
const APPOINTMENT_API =
  process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:3004/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilitySlot {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  consultationType: string;
  isActive: boolean;
}

interface Doctor {
  _id: string;
  id: string;
  name: string;
  email: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  consultationFee?: number;
  isVerified: boolean;
  availability?: AvailabilitySlot[];
}

interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

async function getToken(): Promise<string> {
  const r = await fetch("/api/auth/token");
  if (!r.ok) throw new Error("Not authenticated");
  const { accessToken } = await r.json();
  return accessToken;
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────

function BookingModal({
  doctor,
  onClose,
  onBooked,
}: {
  doctor: Doctor;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [type, setType] = useState<"IN_PERSON" | "VIRTUAL">("IN_PERSON");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = (doctor.availability || []).filter((s) => s.isActive);

  async function handleBook() {
    if (!selectedSlot || !appointmentDate) {
      setError("Please select a slot and date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${APPOINTMENT_API}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: doctor._id || doctor.id,
          slotId: selectedSlot._id,
          appointmentDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          type,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Booking failed");
      }
      onBooked();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Book Appointment</h2>
              <p className="text-sm text-slate-500">
                {doctor.name} · {doctor.specialization || "General"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} className="text-slate-600" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Slot Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Slot
            </label>
            {slots.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No available slots.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot._id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedSlot?._id === slot._id
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 hover:border-sky-300 text-slate-700"
                    }`}
                  >
                    <div className="font-medium">{slot.dayOfWeek}</div>
                    <div className="text-xs text-slate-500">
                      {slot.startTime} – {slot.endTime}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Appointment Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Consultation Type
            </label>
            <div className="flex gap-3">
              {(["IN_PERSON", "VIRTUAL"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    type === t
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600 hover:border-sky-300"
                  }`}
                >
                  {t === "IN_PERSON" ? "🏥 In-Person" : "📹 Virtual"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe your symptoms or reason for visit..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Fee */}
          {doctor.consultationFee && (
            <div className="mb-4 px-3 py-2 bg-emerald-50 rounded-lg">
              <span className="text-sm text-emerald-700 font-medium">
                Consultation Fee: LKR {doctor.consultationFee}
              </span>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={loading || slots.length === 0}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? "Booking…" : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({
  doctor,
  onBook,
}: {
  doctor: Doctor;
  onBook: (doctor: Doctor) => void;
}) {
  const slotCount = (doctor.availability || []).filter((s) => s.isActive).length;
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      {/* Avatar + Name */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{doctor.name}</h3>
          <p className="text-sm text-sky-600 font-medium">
            {doctor.specialization || "General Practitioner"}
          </p>
          {doctor.qualification && (
            <p className="text-xs text-slate-500 truncate">{doctor.qualification}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{doctor.bio}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar size={12} />
          {slotCount} available slot{slotCount !== 1 ? "s" : ""}
        </span>
        {doctor.consultationFee !== undefined && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            LKR {doctor.consultationFee}
          </span>
        )}
      </div>

      <button
        onClick={() => onBook(doctor)}
        disabled={slotCount === 0}
        className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {slotCount === 0 ? "No Available Slots" : "Book Appointment"}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  "All",
  "Cardiologist",
  "Dermatologist",
  "General Practitioner",
  "Neurologist",
  "Ophthalmologist",
  "Orthopedic",
  "Pediatrician",
  "Psychiatrist",
  "Radiologist",
];

export default function DoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [page, setPage] = useState(1);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [booked, setBooked] = useState(false);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12" });
      if (search) params.set("search", search);
      if (specialty !== "All") params.set("specialization", specialty);

      const res = await fetch(`${DOCTOR_API}/doctors?${params}`);
      if (!res.ok) throw new Error("Failed to load doctors");
      const json = await res.json();
      setDoctors(json.data || []);
      setPagination(json.pagination || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [page, search, specialty]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, specialty]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Find a Doctor</h1>
          <p className="text-slate-500">Browse our verified healthcare professionals</p>
        </div>

        {/* Booked success banner */}
        {booked && (
          <div className="mb-6 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm flex items-center gap-2">
            <span>✓</span>
            <span>
              Appointment booked!{" "}
              <button
                onClick={() => router.push("/appointments")}
                className="underline font-medium"
              >
                View appointments
              </button>
            </span>
            <button onClick={() => setBooked(false)} className="ml-auto">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search + Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or keyword…"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* Doctor Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Stethoscope size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">{error}</p>
            <button
              onClick={fetchDoctors}
              className="mt-3 text-sky-500 hover:underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <Stethoscope size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor._id || doctor.id}
                doctor={doctor}
                onBook={setBookingDoctor}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600 px-3">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <BookingModal
          doctor={bookingDoctor}
          onClose={() => setBookingDoctor(null)}
          onBooked={() => setBooked(true)}
        />
      )}
    </div>
  );
}
