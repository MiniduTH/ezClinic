"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EndSessionButtonProps {
    sessionRef: string;
}

function getErrorMessage(payload: unknown): string {
    if (typeof payload !== "object" || payload === null) return "Failed to end session";
    const message = (payload as Record<string, unknown>).message;
    if (typeof message === "string") return message;
    if (Array.isArray(message) && message.length > 0) return String(message[0]);
    const error = (payload as Record<string, unknown>).error;
    if (typeof error === "string") return error;
    return "Failed to end session";
}

export default function EndSessionButton({ sessionRef }: EndSessionButtonProps) {
    const router = useRouter();
    const [isEnding, setIsEnding] = useState(false);
    const [error, setError] = useState("");

    const handleEndSession = async () => {
        const confirmed = window.confirm(
            "End this session now? This will mark the appointment as COMPLETED and trigger completion notification email.",
        );
        if (!confirmed) return;

        setIsEnding(true);
        setError("");

        try {
            const response = await fetch(`/api/telemedicine/${encodeURIComponent(sessionRef)}`, {
                method: "PATCH",
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(getErrorMessage(payload));
            }

            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to end session");
        } finally {
            setIsEnding(false);
        }
    };

    return (
        <div className="flex flex-col items-end gap-2">
            <button
                onClick={handleEndSession}
                disabled={isEnding}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                    borderColor: "var(--danger-border)",
                    color: "var(--danger-text)",
                    background: "var(--danger-surface)",
                }}
            >
                {isEnding ? "Ending..." : "End Session"}
            </button>
            {error && (
                <p className="text-xs" style={{ color: "var(--danger-text)" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
