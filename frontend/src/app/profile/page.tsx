"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserRole } from "@/lib/roles";

const PATIENT_API =
  process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1";
const DOCTOR_API =
  process.env.NEXT_PUBLIC_DOCTOR_API || "http://localhost:3002/api/v1";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  auth0Id?: string | null;
  avatarUrl?: string | null;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization?: string | null;
  qualification?: string | null;
  bio?: string | null;
  consultationFee?: number | null;
  isVerified?: boolean;
  createdAt?: string;
  auth0Id?: string | null;
}

interface Report {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function ErrorState({ message, href, label }: { message: string; href: string; label: string }) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">{message}</h2>
      <Link href={href} className="text-teal-600 hover:text-teal-700 underline">
        {label}
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-600" />
    </div>
  );
}

function PatientProfile() {
  const { user } = useUser();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Could not authenticate");
        const { accessToken } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${accessToken}` };

        const patientRes = await fetch(`${PATIENT_API}/patients/me`, { headers });
        if (!patientRes.ok) {
          if (patientRes.status === 404) {
            setIsNewPatient(true);
            setIsEditing(true);
            return;
          }
          if (patientRes.status === 403) {
            throw new Error("This profile is only available to patient accounts.");
          }
          throw new Error("Failed to fetch patient data.");
        }

        const patientData = await patientRes.json();
        setPatient(patientData);
        setFormData({
          ...patientData,
          dob: patientData.dob ? patientData.dob.split("T")[0] : "",
        });

        const reportsRes = await fetch(
          `${PATIENT_API}/patients/${patientData.id}/reports`,
          { headers }
        );
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err, "An error occurred."));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    if (isNewPatient && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [isNewPatient, user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: Record<string, unknown> = { ...formData };
      if (payload.dob === "") payload.dob = null;
      if (payload.phone === "") payload.phone = null;
      if (payload.gender === "") payload.gender = null;
      if (payload.address === "") payload.address = null;
      if (!payload.name && user?.name) payload.name = user.name;
      if (!payload.email && user?.email) payload.email = user.email;

      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) throw new Error("Could not authenticate");
      const { accessToken } = await tokenRes.json();

      const response = await fetch(
        isNewPatient
          ? `${PATIENT_API}/patients/register`
          : `${PATIENT_API}/patients/${patient!.id}`,
        {
          method: isNewPatient ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to save patient profile.");
      const updatedData = await response.json();
      setPatient(updatedData);
      setFormData({
        ...updatedData,
        dob: updatedData.dob ? updatedData.dob.split("T")[0] : "",
      });
      setIsEditing(false);
      setIsNewPatient(false);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update."));
    } finally {
      setSaving(false);
    }
  };

  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !reportTitle || !patient) return;

    setUploadingReport(true);
    try {
      const data = new FormData();
      data.append("title", reportTitle);
      data.append("file", reportFile);

      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) throw new Error("Could not authenticate");
      const { accessToken } = await tokenRes.json();

      const response = await fetch(
        `${PATIENT_API}/patients/${patient.id}/reports`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: data,
        }
      );

      if (!response.ok) throw new Error("Failed to upload report.");
      const uploadedReport = await response.json();
      setReports((prev) => [uploadedReport, ...prev]);
      setReportTitle("");
      setReportFile(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to upload report."));
    } finally {
      setUploadingReport(false);
    }
  };

  const handleReportDelete = async (reportId: string) => {
    if (!patient || !confirm("Are you sure you want to delete this report?")) return;

    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) throw new Error("Could not authenticate");
      const { accessToken } = await tokenRes.json();

      const response = await fetch(
        `${PATIENT_API}/patients/${patient.id}/reports/${reportId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete report.");
      setReports((prev) => prev.filter((report) => report.id !== reportId));
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to delete report."));
    }
  };

  if (loading) return <LoadingState />;
  if (error || (!patient && !isNewPatient)) {
    return (
      <ErrorState
        message={error || "Patient not found"}
        href="/"
        label="Return Home"
      />
    );
  }

  return (
    <PageShell
      title="Patient Profile"
      subtitle="Manage your personal details and medical reports."
    >
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5 border-b border-gray-100 pb-6 lg:border-b-0 lg:border-r lg:pr-8 lg:pb-0">
          <div className="h-24 w-24 rounded-full bg-teal-600 text-white flex items-center justify-center text-3xl font-bold">
            {(patient?.name || user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {patient?.name || user?.name || "New Patient"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 break-all">
              {patient?.email || user?.email || ""}
            </p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              Status:{" "}
              <span className="font-medium text-gray-900">
                {isNewPatient ? "Profile incomplete" : "Active"}
              </span>
            </p>
            {patient?.createdAt && (
              <p>
                Joined:{" "}
                <span className="font-medium text-gray-900">
                  {new Date(patient.createdAt).toLocaleDateString()}
                </span>
              </p>
            )}
            {(patient?.phone || formData.phone) && (
              <p>
                Phone:{" "}
                <span className="font-medium text-gray-900">
                  {patient?.phone || formData.phone}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Personal Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={() => {
                  if (isNewPatient) {
                    setFormData({
                      name: user?.name || "",
                      email: user?.email || "",
                    });
                    return;
                  }
                  setIsEditing(false);
                  setFormData({
                    ...patient,
                    dob: patient?.dob ? patient.dob.split("T")[0] : "",
                  });
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  isNewPatient
                    ? "hidden"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={isNewPatient}
              >
                Cancel
              </button>
            )}
          </div>

          {!isEditing && patient ? (
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <dt className="text-sm text-gray-500">Full name</dt>
                <dd className="mt-1 font-medium text-gray-900">{patient.name}</dd>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <dt className="text-sm text-gray-500">Gender</dt>
                <dd className="mt-1 font-medium text-gray-900 capitalize">
                  {patient.gender || "Not specified"}
                </dd>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <dt className="text-sm text-gray-500">Date of Birth</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {patient.dob
                    ? new Date(patient.dob).toLocaleDateString()
                    : "Not specified"}
                </dd>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
                <dt className="text-sm text-gray-500">Address</dt>
                <dd className="mt-1 font-medium text-gray-900">
                  {patient.address || "No address provided"}
                </dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  required
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email {!isNewPatient && "(cannot be changed)"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  required
                  disabled={!isNewPatient}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {!isNewPatient && patient && (
            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-lg font-semibold text-gray-900">
                Medical Reports
              </h3>
              <form onSubmit={handleReportUpload} className="mt-5 space-y-4">
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
                  placeholder="Report title"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
                <input
                  type="file"
                  onChange={(e) =>
                    setReportFile(e.target.files ? e.target.files[0] : null)
                  }
                  required
                  className="block w-full text-sm text-gray-600"
                />
                <button
                  type="submit"
                  disabled={uploadingReport || !reportFile || !reportTitle}
                  className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400"
                >
                  {uploadingReport ? "Uploading..." : "Upload Report"}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {reports.length === 0 ? (
                  <p className="text-sm text-gray-500">No reports uploaded yet.</p>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{report.title}</p>
                        <div className="mt-1 text-sm text-gray-500">
                          {new Date(report.uploadedAt).toLocaleDateString()} ·{" "}
                          <a
                            href={report.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline"
                          >
                            View / Download
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => handleReportDelete(report.id)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function DoctorProfile() {
  const { user } = useUser();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewDoctor, setIsNewDoctor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Could not authenticate");
        const { accessToken } = await tokenRes.json();
        const headers = { Authorization: `Bearer ${accessToken}` };

        const doctorRes = await fetch(`${DOCTOR_API}/doctors/me`, { headers });
        if (!doctorRes.ok) {
          if (doctorRes.status === 404) {
            setIsNewDoctor(true);
            setIsEditing(true);
            setFormData({
              name: user?.name || "",
              email: user?.email || "",
              auth0Id: user?.sub,
            });
            return;
          }
          if (doctorRes.status === 403) {
            throw new Error("This profile is only available to doctor accounts.");
          }
          throw new Error("Failed to fetch doctor data.");
        }

        const doctorData = await doctorRes.json();
        setDoctor(doctorData);
        setFormData(doctorData);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "An error occurred."));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.email, user?.name, user?.sub]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "consultationFee" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tokenRes = await fetch("/api/auth/token");
      if (!tokenRes.ok) throw new Error("Could not authenticate");
      const { accessToken } = await tokenRes.json();

      const payload = {
        ...formData,
        name: formData.name || user?.name || "",
        email: formData.email || user?.email || "",
        auth0Id: formData.auth0Id || user?.sub,
        consultationFee:
          formData.consultationFee == null
            ? 0
            : Number(formData.consultationFee),
      };

      const response = await fetch(
        isNewDoctor
          ? `${DOCTOR_API}/doctors/register`
          : `${DOCTOR_API}/doctors/${doctor!.id}`,
        {
          method: isNewDoctor ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Failed to save doctor profile.");
      const updatedData = await response.json();
      setDoctor(updatedData);
      setFormData(updatedData);
      setIsEditing(false);
      setIsNewDoctor(false);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to update."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || (!doctor && !isNewDoctor)) {
    return (
      <ErrorState
        message={error || "Doctor not found"}
        href="/dashboard"
        label="Return to Dashboard"
      />
    );
  }

  return (
    <PageShell
      title="Doctor Profile"
      subtitle="Manage your professional details shown across the clinic platform."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {doctor?.name || user?.name || "New Doctor"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 break-all">
              {doctor?.email || user?.email || ""}
            </p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={() => {
                if (isNewDoctor) {
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                    auth0Id: user?.sub,
                  });
                  return;
                }
                setIsEditing(false);
                setFormData(doctor || {});
              }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                isNewDoctor
                  ? "hidden"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
              disabled={isNewDoctor}
            >
              Cancel
            </button>
          )}
        </div>

        {!isEditing && doctor ? (
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-4">
              <dt className="text-sm text-gray-500">Specialization</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {doctor.specialization || "Not specified"}
              </dd>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <dt className="text-sm text-gray-500">Consultation Fee</dt>
              <dd className="mt-1 font-medium text-gray-900">
                LKR {Number(doctor.consultationFee || 0).toFixed(2)}
              </dd>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <dt className="text-sm text-gray-500">Qualification</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {doctor.qualification || "Not specified"}
              </dd>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4">
              <dt className="text-sm text-gray-500">Verification</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {doctor.isVerified ? "Verified" : "Pending verification"}
              </dd>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
              <dt className="text-sm text-gray-500">Biography</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {doctor.bio || "No biography provided"}
              </dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                required
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email {!isNewDoctor && "(cannot be changed)"}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                required
                disabled={!isNewDoctor}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization || ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Consultation Fee
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="consultationFee"
                  value={formData.consultationFee ?? ""}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Qualification
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Biography
              </label>
              <textarea
                name="bio"
                rows={5}
                value={formData.bio || ""}
                onChange={handleInputChange}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:bg-teal-400"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}

export default function ProfilePage() {
  const { user, isLoading } = useUser();

  if (isLoading) return <LoadingState />;
  if (!user) {
    return (
      <ErrorState
        message="You need to sign in to view your profile."
        href="/auth/login?returnTo=/profile"
        label="Sign In"
      />
    );
  }

  const role = getUserRole(user);

  if (role === "doctor") {
    return <DoctorProfile />;
  }

  if (role === "admin") {
    return (
      <ErrorState
        message="Admin accounts do not use the patient or doctor profile page."
        href="/admin"
        label="Return to Admin Dashboard"
      />
    );
  }

  return <PatientProfile />;
}
