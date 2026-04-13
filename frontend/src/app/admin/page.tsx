"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalPatients: number;
  activePatients: number;
  suspendedPatients: number;
  totalAdmins: number;
  newPatientsThisWeek: number;
  recentPatients: {
    id: string;
    name: string;
    email: string;
    status: string;
    createdAt: string;
  }[];
}

function StatSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-28" />
        ))}
      </div>
      <div className="rounded-2xl bg-gray-200 dark:bg-gray-700 h-64" />
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  suspended: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

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

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_PATIENT_API || "http://localhost:3005/api/v1"}/admins/platform/stats`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!response.ok) {
          if (response.status === 403) throw new Error("Forbidden: Admin access required.");
          throw new Error("Failed to fetch dashboard stats.");
        }
        setStats(await response.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const metricCards = stats
    ? [
        { label: "Total Patients", value: stats.totalPatients, color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-900/20" },
        { label: "Active Patients", value: stats.activePatients, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
        { label: "Suspended", value: stats.suspendedPatients, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20" },
        { label: "New This Week", value: stats.newPatientsThisWeek, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "Admins", value: stats.totalAdmins, color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-700/40" },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Platform-wide statistics and recent activity.</p>
      </div>

      {loading ? (
        <StatSkeleton />
      ) : error ? (
        <div className="p-8 text-center text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      ) : stats ? (
        <div className="space-y-8">
          {/* Metrics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {metricCards.map(({ label, value, color, bg }) => (
              <div key={label} className={`rounded-2xl ${bg} border border-transparent p-6 shadow-sm`}>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`mt-2 text-4xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/patients"
              className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors group shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Manage Patients</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">View, search, and update patient accounts</p>
              </div>
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/admin/doctors"
              className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors group shadow-sm"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Doctor Verification</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review and approve / reject pending doctors</p>
              </div>
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-teal-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Recent patients */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Patients</h2>
              <Link href="/admin/patients" className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline">
                View All →
              </Link>
            </div>
            {stats.recentPatients.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.recentPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{patient.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{patient.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[patient.status] ?? STATUS_BADGE["active"]}`}>
                        {patient.status ?? "active"}
                      </span>
                      <Link
                        href={`/admin/patients`}
                        className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-6 py-8 text-sm text-gray-500 dark:text-gray-400">No recent patients found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
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
