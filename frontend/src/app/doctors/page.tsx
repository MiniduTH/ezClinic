"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Stethoscope, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

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

async function getPatientId(): Promise<string> {
  const r = await fetch("/api/auth/session");
  if (!r.ok) throw new Error("Not authenticated");
  const data = await r.json();
  const sub: string = data?.user?.sub;
  if (!sub) throw new Error("Could not resolve patient identity");
  return sub;
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
      const [token, patientId] = await Promise.all([getToken(), getPatientId()]);
      const res = await fetch(`${APPOINTMENT_API}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          doctorId: doctor._id || doctor.id,
          appointmentDate,
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    background: "var(--bg-surface)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "6px",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border)",
        }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {doctor.name}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {doctor.specialization || "General Practitioner"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "var(--bg-muted)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "transparent")
              }
            >
              <X size={18} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--danger-surface)",
                color: "var(--danger-text)",
                border: "1px solid var(--danger)",
              }}
            >
              {error}
            </div>
          )}

          {/* Slot Selection */}
          <div className="mb-4">
            <label style={labelStyle}>Available Slot</label>
            {slots.length === 0 ? (
              <p
                className="text-sm italic"
                style={{ color: "var(--text-muted)" }}
              >
                No available slots.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot?._id === slot._id;
                  return (
                    <button
                      key={slot._id}
                      onClick={() => setSelectedSlot(slot)}
                      className="text-left px-3 py-2 rounded-lg border text-sm transition-colors"
                      style={{
                        borderColor: isSelected
                          ? "var(--brand)"
                          : "var(--border)",
                        background: isSelected
                          ? "var(--brand-surface)"
                          : "transparent",
                        color: isSelected
                          ? "var(--brand-text)"
                          : "var(--text-secondary)",
                      }}
                    >
                      <div className="font-medium">{slot.dayOfWeek}</div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="mb-4">
            <label style={labelStyle}>Appointment Date</label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Type */}
          <div className="mb-4">
            <label style={labelStyle}>Consultation Type</label>
            <div className="flex gap-2">
              {(["IN_PERSON", "VIRTUAL"] as const).map((t) => {
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors"
                    style={{
                      borderColor: isActive ? "var(--brand)" : "var(--border)",
                      background: isActive
                        ? "var(--brand-surface)"
                        : "transparent",
                      color: isActive
                        ? "var(--brand-text)"
                        : "var(--text-secondary)",
                    }}
                  >
                    {t === "IN_PERSON" ? "In-Person" : "Virtual"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-5">
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe your symptoms or reason for visit..."
              style={{
                ...inputStyle,
                resize: "none",
                lineHeight: "1.5",
              }}
            />
          </div>

          {/* Fee */}
          {doctor.consultationFee && (
            <div
              className="mb-4 px-3 py-2 rounded-lg"
              style={{ background: "var(--brand-surface)" }}
            >
              <span
                className="text-sm font-medium"
                style={{ color: "var(--brand-text)" }}
              >
                Consultation Fee: LKR {doctor.consultationFee}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleBook}
            disabled={loading || slots.length === 0}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{
              background:
                loading || slots.length === 0
                  ? "var(--bg-muted)"
                  : "var(--brand)",
              color:
                loading || slots.length === 0
                  ? "var(--text-muted)"
                  : "white",
            }}
            onMouseEnter={(e) => {
              if (!loading && slots.length > 0)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--brand-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading && slots.length > 0)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--brand)";
            }}
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

  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="rounded-xl border p-5 flex flex-col transition-colors"
      style={{
        background: "var(--bg-elevated)",
        borderColor: hovered ? "var(--brand)" : "var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar + Name */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-full text-white text-base font-semibold"
          style={{
            width: 52,
            height: 52,
            background:
              "linear-gradient(135deg, var(--brand) 0%, #14b8a6 100%)",
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-medium text-sm truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {doctor.name}
          </h3>
          {doctor.specialization && (
            <span
              className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
              style={{
                background: "var(--brand-surface)",
                color: "var(--brand-text)",
              }}
            >
              {doctor.specialization}
            </span>
          )}
          {doctor.qualification && (
            <p
              className="text-xs truncate mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {doctor.qualification}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {doctor.bio && (
        <p
          className="text-sm mb-3 line-clamp-2 flex-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {doctor.bio}
        </p>
      )}

      {/* Stats */}
      <div
        className="flex items-center gap-4 mb-4 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="flex items-center gap-1.5">
          <span
            className="rounded-full flex-shrink-0"
            style={{
              width: 10,
              height: 10,
              background: slotCount > 0 ? "var(--success)" : "var(--text-muted)",
              opacity: slotCount > 0 ? 1 : 0.4,
            }}
          />
          <Calendar size={11} />
          {slotCount} slot{slotCount !== 1 ? "s" : ""}
        </span>
        {doctor.consultationFee !== undefined && (
          <span
            className="font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            LKR {doctor.consultationFee}
          </span>
        )}
      </div>

      {/* Book Button */}
      <button
        onClick={() => onBook(doctor)}
        disabled={slotCount === 0}
        className="w-full rounded-lg text-sm font-medium transition-colors"
        style={{
          height: 40,
          background: slotCount === 0 ? "var(--bg-muted)" : "var(--brand)",
          color: slotCount === 0 ? "var(--text-muted)" : "white",
          cursor: slotCount === 0 ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (slotCount > 0)
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--brand-hover)";
        }}
        onMouseLeave={(e) => {
          if (slotCount > 0)
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--brand)";
        }}
      >
        {slotCount === 0 ? "Not Available" : "Book Appointment"}
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

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    padding: "0 12px",
    height: 40,
    width: "100%",
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-6">
          <h1
            className="text-2xl font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            Find a Doctor
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            Browse our verified healthcare professionals
          </p>
        </div>

        {/* ── Success Banner ── */}
        {booked && (
          <div
            className="mb-5 px-4 py-3 rounded-xl border flex items-center gap-3 text-sm"
            style={{
              background: "var(--brand-surface)",
              borderColor: "var(--brand)",
              color: "var(--brand-text)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-shrink-0"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="flex-1">
              Appointment booked!{" "}
              <button
                onClick={() => router.push("/appointments")}
                className="underline font-medium"
              >
                View appointments
              </button>
            </span>
            <button
              onClick={() => setBooked(false)}
              aria-label="Dismiss"
              style={{ color: "var(--brand-text)" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div
          className="rounded-xl border p-4 mb-6"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or keyword…"
                style={{ ...inputStyle, paddingLeft: 36 }}
              />
            </div>
            {/* Specialty */}
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              style={{
                ...inputStyle,
                width: "auto",
                minWidth: 180,
                cursor: "pointer",
              }}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </form>
        </div>

        {/* ── Doctor Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border p-5 animate-pulse"
                style={{
                  background: "var(--bg-elevated)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex gap-3 mb-4">
                  <div
                    className="w-[52px] h-[52px] rounded-full flex-shrink-0"
                    style={{ background: "var(--bg-muted)" }}
                  />
                  <div className="flex-1 space-y-2 pt-1">
                    <div
                      className="h-3.5 rounded w-3/4"
                      style={{ background: "var(--bg-muted)" }}
                    />
                    <div
                      className="h-3 rounded w-1/2"
                      style={{ background: "var(--bg-muted)" }}
                    />
                  </div>
                </div>
                <div
                  className="h-3 rounded mb-2"
                  style={{ background: "var(--bg-muted)" }}
                />
                <div
                  className="h-3 rounded w-4/5 mb-4"
                  style={{ background: "var(--bg-muted)" }}
                />
                <div
                  className="h-10 rounded-lg"
                  style={{ background: "var(--bg-muted)" }}
                />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-muted)" }}
            >
              <Stethoscope
                size={24}
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {error}
            </p>
            <button
              onClick={fetchDoctors}
              className="mt-3 text-sm underline"
              style={{ color: "var(--brand-text)" }}
            >
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-muted)" }}
            >
              <Stethoscope
                size={24}
                style={{ color: "var(--text-muted)" }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              No doctors found
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
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

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className="text-sm px-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "transparent",
              }}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
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
