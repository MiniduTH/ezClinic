"use client";

import React, { useEffect, useState } from "react";
import { Mail } from "lucide-react";

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
                console.warn("Error fetching notification status:", error);
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

    if (!emailSent || !emailSentAt) {
        return null;
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).format(new Date(emailSentAt));

    return (
        <div
            className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-full px-3 py-1.5 text-xs sm:text-sm shadow-sm animate-in fade-in duration-500"
            style={{
                backgroundColor: "var(--success-surface)",
                border: "1px solid var(--success-border)",
                color: "var(--success-text)",
                boxShadow: "var(--shadow-sm)",
            }}
            role="status"
            aria-live="polite"
        >
            <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: "color-mix(in srgb, var(--success) 22%, transparent)" }}
            >
                <Mail className="h-3 w-3" />
            </span>
            <span className="font-medium">Completion email sent</span>
            <span className="opacity-80">•</span>
            <span className="opacity-90">{formattedDate}</span>
        </div>
    );
}
