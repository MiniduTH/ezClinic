"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

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

export default function PatientProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);

  // Report Upload State
  const [reportTitle, setReportTitle] = useState("");
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  interface Report {
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }
  
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Could not authenticate");
        const { accessToken } = await tokenRes.json();

        const headers = { Authorization: `Bearer ${accessToken}` };

        // Fetch patient by /me
        const patientRes = await fetch(`http://localhost:3005/api/v1/patients/me`, { headers });
        if (!patientRes.ok) {
          if (patientRes.status === 404) {
             setIsNewPatient(true);
             setIsEditing(true);
             return; // Stop here, loading will be set to false finally
          }
          if (patientRes.status === 403) throw new Error("Forbidden access");
          throw new Error("Failed to fetch patient data.");
        }

        const patientData = await patientRes.json();
        setPatient(patientData);
        setFormData({
            ...patientData,
            dob: patientData.dob ? patientData.dob.split('T')[0] : ""
        });

        const reportsRes = await fetch(`http://localhost:3005/api/v1/patients/${patientData.id}/reports`, { headers });
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isNewPatient && user) {
       setFormData(prev => ({
         ...prev,
         name: prev.name || user.name || "",
         email: prev.email || user.email || ""
       }));
    }
  }, [isNewPatient, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean up empty fields if necessary
      const payload: any = { ...formData };
      if (payload.dob === "") payload.dob = null;
      if (payload.phone === "") payload.phone = null;
      if (payload.gender === "") payload.gender = null;
      if (payload.address === "") payload.address = null;
      
      if (!payload.name && user?.name) payload.name = user.name;
      if (!payload.email && user?.email) payload.email = user.email;
      
      const tokenRes = await fetch("/api/auth/token");
      const { accessToken } = await tokenRes.json();

      let response;
      if (isNewPatient) {
        response = await fetch(`http://localhost:3005/api/v1/patients/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`http://localhost:3005/api/v1/patients/${patient!.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload),
        });
      }
      
      if (!response.ok) throw new Error("Failed to save patient profile.");
      const updatedData = await response.json();
      setPatient(updatedData);
      setIsEditing(false);
      setIsNewPatient(false);
    } catch (err: any) {
      alert(err.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportFile || !reportTitle) return;

    setUploadingReport(true);
    try {
      const data = new FormData();
      data.append("title", reportTitle);
      data.append("file", reportFile);

      const tokenRes = await fetch("/api/auth/token");
      const { accessToken } = await tokenRes.json();

      const response = await fetch(`http://localhost:3005/api/v1/patients/${patient!.id}/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: data,
      });

      if (!response.ok) throw new Error("Failed to upload report.");
      const uploadedReport = await response.json();
      setReports((prev) => [uploadedReport, ...prev]);
      
      alert("Report uploaded successfully!");
      setReportTitle("");
      setReportFile(null);
    } catch (err: any) {
      alert(err.message || "Failed to upload report.");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleReportDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    
    try {
      const tokenRes = await fetch("/api/auth/token");
      const { accessToken } = await tokenRes.json();

      const response = await fetch(`http://localhost:3005/api/v1/patients/${patient!.id}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to delete report.");
      setReports((prev) => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert(err.message || "Failed to delete report.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || (!patient && !isNewPatient)) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error || "Patient not found"}</h2>
        <Link href="/admin/patients" className="text-indigo-600 hover:text-indigo-800 underline">
          Return to Admin Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 relative z-10">
        <div className="flex items-center space-x-4">
          <Link href="/admin/patients" className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-white dark:bg-gray-800 shadow-sm p-2 rounded-full border border-gray-200 dark:border-gray-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Patient Profile</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">ID: {patient?.id || 'Pending Completion'}</p>
          </div>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-teal-600 dark:text-teal-400 font-semibold py-2 px-6 border border-teal-200 dark:border-teal-800 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              Edit Profile
            </button>
          ) : (
             <button
              onClick={() => {
                if (isNewPatient) {
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || ""
                  });
                  return;
                }
                setIsEditing(false);
                setFormData({ ...patient, dob: patient?.dob ? patient.dob.split('T')[0] : "" });
              }}
              className={`bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-6 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm transition-all mr-3 ${isNewPatient ? 'opacity-50 cursor-not-allowed hidden' : ''}`}
              disabled={isNewPatient}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-3xl overflow-hidden relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 opacity-50 blur-3xl pointer-events-none"></div>

        <div className="p-8 sm:p-10 relative z-10">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Left Col - Avatar & Summary */}
            <div className="w-full sm:w-1/3 flex flex-col items-center sm:items-start space-y-6 flex-shrink-0">
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800 relative overflow-hidden group">
                  {(patient?.avatarUrl || user?.picture) && !imgError ? (
                    <img src={patient?.avatarUrl || user?.picture || ''} alt="" onError={() => setImgError(true)} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(patient?.name || user?.name || "U").charAt(0).toUpperCase()}</span>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-sm font-medium text-white">Update Photo</span>
                    </div>
                  )}
              </div>
              
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{patient?.name || user?.name || "New Patient"}</h2>
                <div className="mt-1 flex flex-col items-center sm:items-start space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`py-0.5 px-2.5 rounded-full font-medium text-xs ${isNewPatient ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300'}`}>
                      {isNewPatient ? 'Profile Incomplete' : 'Active'}
                    </span>
                    {!isNewPatient && patient && <span>Joined {new Date(patient.createdAt).toLocaleDateString()}</span>}
                  </div>
                  {isNewPatient && <span className="text-sm text-yellow-600 dark:text-yellow-400">Please complete your profile to continue</span>}
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="w-full space-y-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                  <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
                  <span className="text-sm break-all">{patient?.email || user?.email || ""}</span>
                </div>
                {(patient?.phone || formData.phone) && (
                  <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-300">
                    <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span className="text-sm">{patient?.phone || formData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col - Details / Form */}
            <div className="flex-1 w-full max-w-full overflow-hidden">
              {!isEditing && patient ? (
                <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Personal Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1 border-b border-gray-100 dark:border-gray-700 pb-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full name</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-medium">{patient.name}</dd>
                    </div>
                    <div className="sm:col-span-1 border-b border-gray-100 dark:border-gray-700 pb-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-medium capitalize">{patient.gender || 'Not specified'}</dd>
                    </div>
                    <div className="sm:col-span-1 border-b border-gray-100 dark:border-gray-700 pb-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 font-medium">
                        {patient.dob ? new Date(patient.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Address</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 break-words">{patient.address || 'No address provided'}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-teal-100 dark:border-teal-900/50">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Edit Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ""}
                          onChange={handleInputChange}
                          required
                          className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address {!isNewPatient && '(Cannot be changed)'}</label>
                       <div className="mt-1">
                         <input
                           type="email"
                           name="email"
                           value={formData.email || ""}
                           onChange={handleInputChange}
                           required
                           disabled={!isNewPatient}
                           className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-500"
                         />
                       </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleInputChange}
                          className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                      <div className="mt-1">
                        <select
                          name="gender"
                          value={formData.gender || ""}
                          onChange={handleInputChange}
                          className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all"
                        >
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob || ""}
                          onChange={handleInputChange}
                          className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                      <div className="mt-1">
                        <textarea
                          name="address"
                          rows={3}
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-teal-600 border border-transparent rounded-xl shadow-md py-3 px-8 inline-flex justify-center text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:bg-teal-400 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Medical Reports Section */}
              {!isNewPatient && patient && (
                <div className="mt-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    Medical Reports
                  </h3>
                
                <form onSubmit={handleReportUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Report Title</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        required
                        placeholder="e.g. Blood Test Results"
                        className="shadow-inner focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-lg p-3 border bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none transition-all placeholder-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">File</label>
                    <div className="mt-1">
                      <input
                        type="file"
                        onChange={(e) => setReportFile(e.target.files ? e.target.files[0] : null)}
                        required
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 dark:file:bg-teal-900/40 file:text-teal-700 dark:file:text-teal-400 hover:file:bg-teal-100 dark:hover:file:bg-teal-900/60 transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploadingReport || !reportFile || !reportTitle}
                      className="bg-teal-600 border border-transparent rounded-xl shadow-md py-2.5 px-6 inline-flex justify-center text-sm font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:bg-teal-400 hover:-translate-y-0.5"
                    >
                      {uploadingReport ? "Uploading..." : "Upload Report"}
                    </button>
                  </div>
                </form>
                {/* Reports List */}
                <div className="mt-8 space-y-4">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">Uploaded Reports</h4>
                  {reports.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reports uploaded yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
                      {reports.map((report) => (
                        <li key={report.id} className="py-4 flex justify-between items-center group">
                          <div className="flex items-start">
                            <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg text-teal-600 dark:text-teal-400 mr-3 transition-colors group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{report.title}</p>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex space-x-2">
                                <span>{new Date(report.uploadedAt).toLocaleDateString()}</span>
                                <span>&bull;</span>
                                <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline">
                                  View / Download
                                </a>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleReportDelete(report.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Report"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
