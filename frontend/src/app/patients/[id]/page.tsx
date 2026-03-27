"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchPatient() {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/patients/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error("Patient not found");
          throw new Error("Failed to fetch patient data.");
        }
        const data = await response.json();
        setPatient(data);
        setFormData({
            ...data,
            dob: data.dob ? data.dob.split('T')[0] : ""
        });
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Clean up empty fields if necessary
      const payload = { ...formData };
      if (payload.dob === "") delete payload.dob;
      
      const response = await fetch(`http://localhost:3001/api/v1/patients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error("Failed to update patient profile.");
      const updatedData = await response.json();
      setPatient(updatedData);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || "Failed to update.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !patient) {
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
          <Link href="/admin/patients" className="text-gray-400 hover:text-gray-600 bg-white shadow-sm p-2 rounded-full border border-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Profile</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">ID: {patient.id}</p>
          </div>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white hover:bg-gray-50 text-indigo-700 font-semibold py-2 px-6 border border-indigo-200 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              Edit Profile
            </button>
          ) : (
             <button
              onClick={() => {
                setIsEditing(false);
                setFormData({ ...patient, dob: patient.dob ? patient.dob.split('T')[0] : "" }); // Reset to original
              }}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 border border-gray-300 rounded-xl shadow-sm transition-all mr-3"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl shadow-2xl ring-1 ring-gray-900/5 sm:rounded-3xl overflow-hidden relative">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 opacity-50 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 opacity-50 blur-3xl pointer-events-none"></div>

        <div className="p-8 sm:p-10 relative z-10">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Left Col - Avatar & Summary */}
            <div className="w-full sm:w-1/3 flex flex-col items-center sm:items-start space-y-6">
              <div className="h-40 w-40 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg ring-4 ring-white relative overflow-hidden group">
                  {patient.avatarUrl ? (
                    <img src={patient.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{patient.name.charAt(0).toUpperCase()}</span>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-sm font-medium">Update Photo</span>
                    </div>
                  )}
              </div>
              
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
                <div className="mt-1 flex items-center justify-center sm:justify-start space-x-2 text-sm text-gray-500">
                  <span className="bg-green-100 text-green-800 py-0.5 px-2.5 rounded-full font-medium text-xs">Active</span>
                  <span>Joined {new Date(patient.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Quick Info Cards */}
              <div className="w-full space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-3 text-gray-600">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <span className="text-sm">{patient.email}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span className="text-sm">{patient.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col - Details / Form */}
            <div className="flex-1">
              {!isEditing ? (
                <div className="bg-white/50 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    Personal Information
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                    <div className="sm:col-span-1 border-b border-gray-100 pb-4">
                      <dt className="text-sm font-medium text-gray-500">Full name</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">{patient.name}</dd>
                    </div>
                    <div className="sm:col-span-1 border-b border-gray-100 pb-4">
                      <dt className="text-sm font-medium text-gray-500">Gender</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium capitalize">{patient.gender || 'Not specified'}</dd>
                    </div>
                    <div className="sm:col-span-1 border-b border-gray-100 pb-4">
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-medium">
                        {patient.dob ? new Date(patient.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2 pt-2 border-b border-gray-100 pb-4">
                      <dt className="text-sm font-medium text-gray-500">Full Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{patient.address || 'No address provided'}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Edit Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Full name</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ""}
                          onChange={handleInputChange}
                          required
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border bg-gray-50 outline-none transition-shadow"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone || ""}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border bg-gray-50 outline-none transition-shadow"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <div className="mt-1">
                        <select
                          name="gender"
                          value={formData.gender || ""}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border bg-gray-50 outline-none transition-shadow"
                        >
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="dob"
                          value={formData.dob || ""}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border bg-gray-50 outline-none transition-shadow"
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <div className="mt-1">
                        <textarea
                          name="address"
                          rows={3}
                          value={formData.address || ""}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border bg-gray-50 outline-none transition-shadow"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-indigo-600 border border-transparent rounded-xl shadow-sm py-2.5 px-6 inline-flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-indigo-400"
                    >
                      {saving ? "Saving Changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
