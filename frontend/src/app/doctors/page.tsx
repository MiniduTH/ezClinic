"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Stethoscope,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  BadgeCheck,
  Clock,
  Banknote,
} from "lucide-react";
import { useUser } from "@/lib/session-context";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-md max-h-[92vh] sm:max-h-[88vh] overflow-y-auto sm:rounded-2xl rounded-t-2xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Book Appointment
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {doctor.name} · {doctor.specialization || "General Practitioner"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "var(--bg-muted)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
            }
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Error */}
          {error && (
            <div
              className="px-3 py-2.5 rounded-xl text-sm"
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
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Available Slots
            </label>
            {slots.length === 0 ? (
              <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>
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
                      className="text-left px-3 py-2.5 rounded-xl border text-sm transition-all"
                      style={{
                        borderColor: isSelected ? "var(--brand)" : "var(--border)",
                        background: isSelected ? "var(--brand-surface)" : "transparent",
                        color: isSelected ? "var(--brand-text)" : "var(--text-secondary)",
                      }}
                    >
                      <div className="font-medium text-xs">{slot.dayOfWeek}</div>
                      <div className="text-xs mt-0.5 opacity-70">
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Appointment Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Consultation Type */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Consultation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["IN_PERSON", "VIRTUAL"] as const).map((t) => {
                const isActive = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className="py-2.5 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      borderColor: isActive ? "var(--brand)" : "var(--border)",
                      background: isActive ? "var(--brand-surface)" : "transparent",
                      color: isActive ? "var(--brand-text)" : "var(--text-secondary)",
                    }}
                  >
                    {t === "IN_PERSON" ? "In-Person" : "Virtual"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Notes <span className="normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe your symptoms or reason for visit…"
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                lineHeight: "1.6",
              }}
            />
          </div>

          {/* Fee */}
          {doctor.consultationFee !== undefined && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--brand-surface)" }}
            >
              <Banknote size={15} style={{ color: "var(--brand-text)" }} className="flex-shrink-0" />
              <span className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                Consultation Fee: LKR {doctor.consultationFee}
              </span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleBook}
            disabled={loading || slots.length === 0}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading || slots.length === 0 ? "var(--bg-muted)" : "var(--brand)",
              color: loading || slots.length === 0 ? "var(--text-muted)" : "white",
              cursor: loading || slots.length === 0 ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading && slots.length > 0)
                (e.currentTarget as HTMLButtonElement).style.background = "var(--brand-hover)";
            }}
            onMouseLeave={(e) => {
              if (!loading && slots.length > 0)
                (e.currentTarget as HTMLButtonElement).style.background = "var(--brand)";
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

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
  "linear-gradient(135deg, #0891b2 0%, #6366f1 100%)",
  "linear-gradient(135deg, #0d9488 0%, #059669 100%)",
  "linear-gradient(135deg, #0369a1 0%, #0d9488 100%)",
  "linear-gradient(135deg, #7c3aed 0%, #0d9488 100%)",
];

function DoctorCard({
  doctor,
  isLoggedIn,
  onBook,
}: {
  doctor: Doctor;
  isLoggedIn: boolean;
  onBook: (doctor: Doctor) => void;
}) {
  const router = useRouter();
  const slotCount = (doctor.availability || []).filter((s) => s.isActive).length;
  const initials = doctor.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const gradientIndex =
    doctor.name.charCodeAt(0) % AVATAR_GRADIENTS.length;

  const handleBookClick = () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=/doctors");
      return;
    }
    onBook(doctor);
  };

  const ctaDisabled = isLoggedIn && slotCount === 0;

  return (
    <div
      className="group rounded-2xl border flex flex-col overflow-hidden transition-all duration-200"
      style={{
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--brand)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 8px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Card body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Avatar + identity */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-2xl text-white text-lg font-bold"
            style={{
              width: 56,
              height: 56,
              background: AVATAR_GRADIENTS[gradientIndex],
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                className="font-semibold text-sm leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {doctor.name}
              </h3>
              {doctor.isVerified && (
                <BadgeCheck
                  size={14}
                  style={{ color: "var(--brand)", flexShrink: 0 }}
                />
              )}
            </div>
            {doctor.specialization && (
              <span
                className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1.5"
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
                className="text-xs mt-1 truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {doctor.qualification}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {doctor.bio ? (
          <p
            className="text-xs leading-relaxed mb-4 flex-1"
            style={{
              color: "var(--text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {doctor.bio}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {/* Stats row */}
        <div
          className="flex items-center justify-between py-3 border-t border-b mb-4 text-xs"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: slotCount > 0 ? "var(--success)" : "var(--text-muted)",
                opacity: slotCount > 0 ? 1 : 0.4,
              }}
            />
            <Clock size={11} />
            <span>
              {slotCount} slot{slotCount !== 1 ? "s" : ""} available
            </span>
          </div>
          {doctor.consultationFee !== undefined && (
            <span
              className="font-semibold text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              LKR {doctor.consultationFee}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleBookClick}
          disabled={ctaDisabled}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            height: 40,
            background: ctaDisabled
              ? "var(--bg-muted)"
              : !isLoggedIn
              ? "transparent"
              : "var(--brand)",
            color: ctaDisabled
              ? "var(--text-muted)"
              : !isLoggedIn
              ? "var(--brand-text)"
              : "white",
            border: !isLoggedIn && !ctaDisabled ? "1.5px solid var(--brand)" : "none",
            cursor: ctaDisabled ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (ctaDisabled) return;
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = isLoggedIn ? "var(--brand-hover)" : "var(--brand-surface)";
          }}
          onMouseLeave={(e) => {
            if (ctaDisabled) return;
            const btn = e.currentTarget as HTMLButtonElement;
            btn.style.background = isLoggedIn ? "var(--brand)" : "transparent";
          }}
        >
          {!isLoggedIn ? (
            <>
              <Lock size={13} />
              Sign in to Book
            </>
          ) : ctaDisabled ? (
            "Fully Booked"
          ) : (
            <>
              <Calendar size={13} />
              Book Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border p-5 animate-pulse"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <div className="flex gap-3.5 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex-shrink-0"
          style={{ background: "var(--bg-muted)" }}
        />
        <div className="flex-1 pt-1 space-y-2">
          <div className="h-3.5 rounded w-3/4" style={{ background: "var(--bg-muted)" }} />
          <div className="h-3 rounded w-1/2" style={{ background: "var(--bg-muted)" }} />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2.5 rounded" style={{ background: "var(--bg-muted)" }} />
        <div className="h-2.5 rounded w-4/5" style={{ background: "var(--bg-muted)" }} />
      </div>
      <div className="h-px mb-4" style={{ background: "var(--bg-muted)" }} />
      <div className="h-10 rounded-xl" style={{ background: "var(--bg-muted)" }} />
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const isLoggedIn = !authLoading && !!user;

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [page, setPage] = useState(1);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [booked, setBooked] = useState(false);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);

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

  useEffect(() => {
    setPage(1);
  }, [search, specialty]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  const showGuestBanner = !authLoading && !isLoggedIn && !guestBannerDismissed;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 py-8 space-y-5">

        {/* ── Guest Banner ── */}
        {showGuestBanner && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm"
            style={{
              background: "var(--brand-surface)",
              borderColor: "var(--brand)",
              color: "var(--brand-text)",
            }}
          >
            <Lock size={15} className="flex-shrink-0" />
            <span className="flex-1">
              <Link
                href="/login?redirect=/doctors"
                className="font-semibold underline underline-offset-2"
              >
                Sign in
              </Link>{" "}
              to book appointments with our verified doctors.
            </span>
            <button
              onClick={() => setGuestBannerDismissed(true)}
              aria-label="Dismiss"
              className="p-1 rounded-lg transition-opacity opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Success Banner ── */}
        {booked && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm"
            style={{
              background: "var(--brand-surface)",
              borderColor: "var(--brand)",
              color: "var(--brand-text)",
            }}
          >
            <svg
              width="15"
              height="15"
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
                className="underline font-semibold underline-offset-2"
              >
                View appointments →
              </button>
            </span>
            <button
              onClick={() => setBooked(false)}
              aria-label="Dismiss"
              className="p-1 rounded-lg transition-opacity opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Find a Doctor
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Browse our verified healthcare professionals
            </p>
          </div>
          {pagination && !loading && (
            <span
              className="text-sm font-medium tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {pagination.totalItems} doctor{pagination.totalItems !== 1 ? "s" : ""} available
            </span>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div
          className="rounded-2xl border p-3"
          style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
        >
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
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
                className="w-full h-10 rounded-xl pl-9 pr-3 text-sm outline-none"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="h-10 rounded-xl px-3 text-sm outline-none cursor-pointer"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                minWidth: 180,
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
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-2xl border py-16 text-center"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-muted)" }}
            >
              <Stethoscope size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
              {error}
            </p>
            <button
              onClick={fetchDoctors}
              className="text-sm underline underline-offset-2 mt-1"
              style={{ color: "var(--brand-text)" }}
            >
              Try again
            </button>
          </div>
        ) : doctors.length === 0 ? (
          <div
            className="rounded-2xl border py-16 text-center"
            style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--bg-muted)" }}
            >
              <Stethoscope size={24} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              No doctors found
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor._id || doctor.id}
                doctor={doctor}
                isLoggedIn={isLoggedIn}
                onBook={setBookingDoctor}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all disabled:opacity-35"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div
              className="flex items-center gap-1 px-3 h-9 rounded-xl border text-sm"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
              }}
            >
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {page}
              </span>
              <span className="opacity-40">/</span>
              <span>{pagination.totalPages}</span>
            </div>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all disabled:opacity-35"
              style={{
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
                background: "var(--bg-elevated)",
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
