import React from 'react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { Video, Calendar, User, Clock, AlertCircle } from 'lucide-react';

type SessionStatus = 'SCHEDULED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';

interface TelemedicineSession {
  sessionId: string;
  doctorName: string;
  patientName: string;
  scheduledAt: string;
  status: SessionStatus;
  meetingUrl: string;
}

export default async function TelemedicineSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  let sessionData: TelemedicineSession | null = null;
  let fetchError = false;

  try {
    const headersList = await headers();
    const cookieString = headersList.get('cookie') || '';
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/telemedicine/${sessionId}`, {
      method: 'GET',
      headers: {
        cookie: cookieString,
      },
      cache: 'no-store', // Always fetch latest session state
    });

    if (res.ok) {
      sessionData = await res.json();
    } else {
      fetchError = true;
      console.error(`Failed to fetch session. Status: ${res.status}`);
    }
  } catch (error) {
    console.error('Error in TelemedicineSessionPage server fetch:', error);
    fetchError = true;
  }

  if (fetchError || !sessionData) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-100 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notice</h1>
        <p className="text-gray-500 mb-8">
          Unable to load telemedicine session details or the session does not exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(sessionData.scheduledAt));

  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(sessionData.scheduledAt));

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STARTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const showIframe = sessionData.status === 'SCHEDULED' || sessionData.status === 'STARTED';

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="bg-white px-6 py-6 border-b border-gray-200 rounded-lg shadow-sm border mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Virtual Consultation
          </h1>
          <div className="mt-2 text-sm text-gray-500 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700">Dr. {sessionData.doctorName}</span> 
              <span className="text-gray-400 mx-1">•</span> 
              <span>Patient: {sessionData.patientName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
        
        <div>
           <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(sessionData.status)}`}>
            {sessionData.status}
          </span>
        </div>
      </div>

      {/* Jitsi Meet Encapsulation or Status State */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
        {showIframe && sessionData.meetingUrl ? (
          <iframe
            src={sessionData.meetingUrl}
            allow="camera; microphone; fullscreen; display-capture"
            className="w-full grow"
            style={{ height: '600px', border: 'none' }}
            title={`Telemedicine session for ${sessionData.patientName}`}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
             <div className="inline-flex items-center justify-center p-4 bg-gray-200 rounded-full mb-4">
               {sessionData.status === 'COMPLETED' ? (
                 <CheckCircle className="w-8 h-8 text-gray-600" />
               ) : (
                 <AlertCircle className="w-8 h-8 text-red-600" />
               )}
             </div>
             <h2 className="text-xl font-bold text-gray-900 mb-2">
               Session {sessionData.status.toLowerCase()}
             </h2>
             <p className="text-gray-500 max-w-md">
               This telemedicine session has been {sessionData.status.toLowerCase()}. The meeting room is no longer available.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Ensure proper icon is imported for 'CheckCircle' fallback
import { CheckCircle } from 'lucide-react';
