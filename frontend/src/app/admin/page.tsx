"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  totalAdmins: number;
  recentPatients: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const tokenRes = await fetch("/api/auth/token");
        if (!tokenRes.ok) throw new Error("Could not authenticate");
        const { accessToken } = await tokenRes.json();

        const response = await fetch("http://localhost:3005/api/v1/admins/platform/stats", {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 403) throw new Error("Forbidden: Admin access required.");
          throw new Error("Failed to fetch dashboard stats.");
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard Overview</h1>
        <p className="mt-2 text-sm text-gray-600">Platform-wide statistics and recent activity.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
          <span>{error}</span>
        </div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalPatients}</dd>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Admins</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalAdmins}</dd>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Patients</h2>
              <Link href="/admin/patients" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View All
              </Link>
            </div>
            
            {stats.recentPatients.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {stats.recentPatients.map((patient) => (
                  <li key={patient.id} className="py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      <p className="text-sm text-gray-500">{patient.email}</p>
                    </div>
                    <Link href={`/patients/${patient.id}`} className="text-indigo-600 hover:underline text-sm">
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 py-4">No recent patients found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
