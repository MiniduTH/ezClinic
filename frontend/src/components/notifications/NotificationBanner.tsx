"use client";

import React, { useEffect, useState } from 'react';
import { Mail, Clock } from 'lucide-react';

interface NotificationStatus {
  appointmentId: string;
  emailSent: boolean;
  emailSentAt: string | null;
}

export default function NotificationBanner({ appointmentId }: { appointmentId: string }) {
  const [status, setStatus] = useState<NotificationStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      if (!appointmentId) return;

      try {
        const res = await fetch(`/api/notifications/status/${appointmentId}`);
        if (!res.ok) {
          // Fail silently as per rules for non-critical UI element
          console.warn(`Failed to fetch notification status: ${res.status}`);
          return;
        }

        const data = await res.json();
        if (isMounted) {
          setStatus(data);
        }
      } catch (error) {
        // Silent fail
        console.warn('Error fetching notification status:', error);
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [appointmentId]);

  if (!status) {
    return null; // Do not break DOM bounds, render nothing if no status
  }

  const { emailSent, emailSentAt } = status;

  if (emailSent && emailSentAt) {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date(emailSentAt));

    return (
      <div className="w-full bg-green-50 border border-green-200 rounded-md p-3 flex items-center justify-between text-sm shadow-sm animate-in fade-in duration-500">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">
            Confirmation email sent at {formattedDate}.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-amber-50 border border-amber-200 rounded-md p-3 flex items-center justify-between text-sm shadow-sm animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
         <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
         <span className="font-medium text-amber-800">
           Confirmation email is being processed.
         </span>
      </div>
    </div>
  );
}
