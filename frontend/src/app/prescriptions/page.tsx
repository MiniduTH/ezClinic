"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionForm {
  patientId: string;
  patientName: string;
  appointmentId: string;
  diagnosis: string;
  medications: Medication[];
  notes: string;
  followUpDate: string;
}

const emptyMedication: Medication = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
};

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Before meals",
  "After meals",
  "At bedtime",
];

const DURATION_OPTIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "21 days",
  "30 days",
  "60 days",
  "90 days",
  "Until follow-up",
  "Ongoing",
];

export default function PrescriptionPage() {
  const [form, setForm] = useState<PrescriptionForm>({
    patientId: "",
    patientName: "",
    appointmentId: "",
    diagnosis: "",
    medications: [{ ...emptyMedication }],
    notes: "",
    followUpDate: "",
  });

  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace with actual doctor ID from auth context
  const doctorId = "placeholder-doctor-id";

  const updateField = (field: keyof PrescriptionForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string
  ) => {
    setForm((prev) => {
      const meds = [...prev.medications];
      meds[index] = { ...meds[index], [field]: value };
      return { ...prev, medications: meds };
    });
  };

  const addMedication = () => {
    setForm((prev) => ({
      ...prev,
      medications: [...prev.medications, { ...emptyMedication }],
    }));
  };

  const removeMedication = (index: number) => {
    if (form.medications.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const validate = (): string | null => {
    if (!form.patientId.trim()) return "Patient ID is required.";
    if (!form.appointmentId.trim()) return "Appointment ID is required.";
    for (let i = 0; i < form.medications.length; i++) {
      const med = form.medications[i];
      if (!med.name.trim()) return `Medication ${i + 1}: Name is required.`;
      if (!med.dosage.trim()) return `Medication ${i + 1}: Dosage is required.`;
      if (!med.frequency.trim())
        return `Medication ${i + 1}: Frequency is required.`;
      if (!med.duration.trim())
        return `Medication ${i + 1}: Duration is required.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSummary(null);

    try {
      const res = await fetch(
        `${API_URL}/doctors/${doctorId}/prescriptions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || data?.error?.message || "Failed to issue prescription");
      }

      setSuccess(true);
      setSummary(data.data?.summary || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      patientId: "",
      patientName: "",
      appointmentId: "",
      diagnosis: "",
      medications: [{ ...emptyMedication }],
      notes: "",
      followUpDate: "",
    });
    setSuccess(false);
    setSummary(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Issue Digital Prescription
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the patient details and medications to generate a digital
            prescription.
          </p>
        </div>
        <button
          onClick={resetForm}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Form
        </button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <span className="text-emerald-600 text-xl mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-emerald-800">
              Prescription issued successfully!
            </p>
            <p className="text-sm text-emerald-600">
              The patient will be notified via email and in-app notification.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-red-600 text-xl mt-0.5">✕</span>
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Form ── */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Patient & Appointment Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>👤</span> Patient Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.patientId}
                  onChange={(e) => updateField("patientId", e.target.value)}
                  placeholder="UUID of the patient"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name
                </label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => updateField("patientName", e.target.value)}
                  placeholder="e.g. Nethmi Perera"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.appointmentId}
                  onChange={(e) => updateField("appointmentId", e.target.value)}
                  placeholder="UUID of the appointment"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis
                </label>
                <input
                  type="text"
                  value={form.diagnosis}
                  onChange={(e) => updateField("diagnosis", e.target.value)}
                  placeholder="e.g. Mild Hypertension (Stage 1)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* Medications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>💊</span> Medications
              </h2>
              <button
                type="button"
                onClick={addMedication}
                className="px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
              >
                + Add Medication
              </button>
            </div>
            <div className="p-6 space-y-4">
              {form.medications.map((med, idx) => (
                <div
                  key={idx}
                  className="relative p-4 bg-gray-50 rounded-xl border border-gray-100 group"
                >
                  {form.medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(idx)}
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove medication"
                    >
                      ✕
                    </button>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      Medication {idx + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) =>
                          updateMedication(idx, "name", e.target.value)
                        }
                        placeholder="Medication name (e.g. Aspirin 75mg)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) =>
                          updateMedication(idx, "dosage", e.target.value)
                        }
                        placeholder="Dosage (e.g. 1 tablet)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={med.frequency}
                        onChange={(e) =>
                          updateMedication(idx, "frequency", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      >
                        <option value="">Select frequency</option>
                        {FREQUENCY_OPTIONS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={med.duration}
                        onChange={(e) =>
                          updateMedication(idx, "duration", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                      >
                        <option value="">Select duration</option>
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Follow-up */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📝</span> Additional Details
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Instructions
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                  placeholder="e.g. Follow a low-sodium diet. Avoid strenuous exercise."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                />
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={form.followUpDate}
                  onChange={(e) => updateField("followUpDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Issuing Prescription...
                </span>
              ) : (
                "Issue Prescription"
              )}
            </button>
          </div>
        </form>

        {/* ── Right: Live Preview ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>👁️</span> Live Preview
                </h3>
              </div>
              <div className="p-4">
                {summary ? (
                  <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                    {summary}
                  </pre>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="text-center py-2 border-b border-gray-100">
                      <p className="font-bold text-gray-800 text-sm">
                        ezClinic
                      </p>
                      <p className="text-gray-500">Digital Prescription</p>
                    </div>
                    <div className="space-y-1.5 text-gray-600">
                      <p>
                        <span className="font-medium text-gray-700">
                          Patient:
                        </span>{" "}
                        {form.patientName || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          Diagnosis:
                        </span>{" "}
                        {form.diagnosis || "—"}
                      </p>
                    </div>

                    {form.medications.some((m) => m.name) && (
                      <div className="border-t border-gray-100 pt-2">
                        <p className="font-semibold text-gray-700 mb-1.5">
                          Medications:
                        </p>
                        {form.medications
                          .filter((m) => m.name)
                          .map((med, i) => (
                            <div
                              key={i}
                              className="ml-2 mb-2 pl-2 border-l-2 border-blue-200"
                            >
                              <p className="font-medium text-gray-800">
                                {i + 1}. {med.name}
                              </p>
                              {med.dosage && (
                                <p className="text-gray-500">
                                  {med.dosage}
                                  {med.frequency && ` • ${med.frequency}`}
                                  {med.duration && ` • ${med.duration}`}
                                </p>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {form.notes && (
                      <div className="border-t border-gray-100 pt-2">
                        <p className="font-semibold text-gray-700 mb-1">
                          Notes:
                        </p>
                        <p className="text-gray-500 italic">{form.notes}</p>
                      </div>
                    )}

                    {form.followUpDate && (
                      <div className="border-t border-gray-100 pt-2">
                        <p>
                          <span className="font-medium text-gray-700">
                            Follow-up:
                          </span>{" "}
                          {new Date(form.followUpDate).toLocaleDateString(
                            "en-LK",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    )}

                    {!form.patientName &&
                      !form.diagnosis &&
                      !form.medications.some((m) => m.name) && (
                        <p className="text-gray-400 text-center py-4 italic">
                          Start filling in the form to see a live preview...
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
