"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUserRole } from "@/lib/roles";
import Link from "next/link";
import { Video, Calendar, User, Clock, CheckCircle, Activity } from "lucide-react";

const APPOINTMENT_API =
  process.env.NEXT_PUBLIC_APPOINTMENT_API || "http://localhost:8080/api/v1";

interface TelemedicineAppointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "STARTED" | "IN_PROGRESS";
  reason?: string;
  symptoms?: string; // Sourced from AI Symptom Checker if booked through there
}

export default function TelemedicineDashboard() {
  const { user, isLoading } = useUser();
  const [appointments, setAppointments] = useState<TelemedicineAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Hardcoded for demo/mockup. In prod, fetch from doctor-service profile endpoint
  const doctorId = (user as Record<string, unknown>)?.["https://ezclinic.com/doctorId"] as string || "69d71304d77fd0bbf5ec13eb";

  useEffect(() => {
    fetch("/api/auth/token")
      .then((r) => r.json())
      .then((data) => setAccessToken(data.accessToken ?? null))
      .catch(() => setAccessToken(null));
  }, []);

  const fetchTelemedicineAppointments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${APPOINTMENT_API}/appointments/doctor/${doctorId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to load virtual queue.");
      const data = await res.json();
      
      const mapped = Array.isArray(data)
        ? data
            .filter((a: Record<string, unknown>) => ((a.type || a.consultationType) as string)?.toLowerCase() === "telemedicine")
            .map((a: Record<string, unknown>) => ({
              id: (a.id || a._id) as string,
              patientId: a.patientId as string,
              patientName: (a.patientName || "Unknown Patient") as string,
              date: (a.date || a.appointmentDate) as string,
              time: (a.time || a.appointmentTime) as string,
              status: ((a.status as string || "PENDING")).toUpperCase() as TelemedicineAppointment['status'],
              reason: (a.reason || a.issues) as string,
              symptoms: (a.symptoms || undefined) as string | undefined // Mocking where the symptom context would land
            }))
        : [];
      setAppointments(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [doctorId, accessToken]);

  useEffect(() => {
    if (accessToken) fetchTelemedicineAppointments();
  }, [fetchTelemedicineAppointments, accessToken]);

  if (isLoading || (loading && !error)) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4" />
         <p className="text-gray-500 font-medium animate-pulse">Initializing Virtual Clinic...</p>
      </div>
    );
  }

  if (user && getUserRole(user) !== "doctor") {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2">Only verified medical professionals can access the Telemedicine Dashboard.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const activeQueue = appointments.filter(a => a.status === "CONFIRMED" || a.status === "PENDING" || a.status === "STARTED" || a.status === "IN_PROGRESS");
  const pastSessions = appointments.filter(a => a.status === "COMPLETED");

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <Video className="w-8 h-8 text-blue-600" />
          Virtual Clinic Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          Manage your virtual waiting room and initiate telemedicine sessions.
        </p>
      </div>

      {error && (
         <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center gap-2">
            <Activity className="w-5 h-5 shrink-0" />
            <p>{error}</p>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Queue Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Today&apos;s Virtual Queue ({activeQueue.length})
          </h2>

          {activeQueue.length === 0 ? (
            <div className="bg-white border text-center p-12 border-gray-200 shadow-sm rounded-2xl">
              <p className="text-gray-500 font-medium">Your virtual waiting room is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeQueue.map((apt) => (
                <div key={apt.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-gray-900">{apt.patientName}</h3>
                        {apt.status === "PENDING" && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded border border-yellow-200">
                            AWAITING CONFIRMATION
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {apt.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {apt.time}</span>
                      </div>

                      {apt.reason && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-100">
                          <span className="font-semibold text-gray-900 block mb-1">Patient Reason:</span>
                          {apt.reason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-end shrink-0">
                      {(apt.status === "CONFIRMED") ? (
                        <Link
                          href={`/telemedicine/${apt.id}`}
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          Start Session
                        </Link>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Confirm appointment to start session.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-blue-50 bg-opacity-50 border border-blue-100 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Quick Stats</h3>
            <ul className="space-y-4">
               <li className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-50 shadow-sm">
                  <span className="text-gray-600 text-sm font-medium">Waiting</span>
                  <span className="text-xl font-bold text-blue-600">{activeQueue.length}</span>
               </li>
               <li className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-50 shadow-sm">
                  <span className="text-gray-600 text-sm font-medium">Completed</span>
                  <span className="text-xl font-bold text-green-600">{pastSessions.length}</span>
               </li>
            </ul>
          </div>

          <div>
             <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Completed Sessions
             </h2>
             {pastSessions.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No completed sessions today.</p>
             ) : (
                <ul className="space-y-3">
                   {pastSessions.slice(0, 5).map(session => (
                     <li key={session.id} className="bg-white border border-gray-100 rounded-lg p-3 text-sm flex justify-between shadow-sm">
                        <span className="font-medium text-gray-800">{session.patientName}</span>
                        <span className="text-gray-500">{session.time}</span>
                     </li>
                   ))}
                </ul>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
