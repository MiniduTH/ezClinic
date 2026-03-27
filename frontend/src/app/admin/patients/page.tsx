"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  createdAt: string;
}

export default function AdminPatientList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch("http://localhost:3001/api/v1/patients");
        if (!response.ok) throw new Error("Failed to fetch patients.");
        const data = await response.json();
        setPatients(data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Overview of all registered patients in the system.</p>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-lg shadow-xl ring-1 ring-gray-900/5 sm:rounded-2xl overflow-hidden shadow-indigo-100 transition-all">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <span className="bg-red-50 px-4 py-2 rounded-lg inline-block border border-red-200">{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Patient Name
                  </th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Contact Info
                  </th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Age & Gender
                  </th>
                  <th scope="col" className="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Joined
                  </th>
                  <th scope="col" className="relative py-4 pl-3 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white/50">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                      No patients found.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                              {patient.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{patient.name}</div>
                            <div className="flex items-center text-xs text-gray-400 font-mono mt-1 w-24 truncate" title={patient.id}>
                              {patient.id.split('-')[0]}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">
                        <div className="text-sm text-gray-900">{patient.email}</div>
                        <div className="text-sm text-gray-500">{patient.phone || "N/A"}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {patient.gender ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize mr-2">
                             {patient.gender}
                           </span>
                         ) : (
                           <span className="text-gray-400 mr-2">-</span>
                         )}
                         {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(patient.createdAt).toLocaleDateString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="bg-indigo-50 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 px-4 py-2 rounded-lg font-semibold transition-colors inline-block"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
