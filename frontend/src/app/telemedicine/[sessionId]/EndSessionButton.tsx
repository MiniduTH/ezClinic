"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EndSessionButton({ sessionId, appointmentId }: { sessionId: string; appointmentId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onEndSession = async () => {
        const ok = window.confirm("End this session and mark the appointment as COMPLETED?");
        if (!ok) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/telemedicine/${sessionId}/end`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointmentId }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error((payload as { error?: string })?.error || "Failed to end session");
            }

            router.push("/appointments");
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to end session");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onEndSession}
                disabled={loading}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{
                    background: "var(--danger-surface)",
                    color: "var(--danger-text)",
                    border: "1px solid var(--danger-border)",
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? "Ending..." : "End Session"}
            </button>
            {error ? (
                <span className="text-xs" style={{ color: "var(--danger-text)" }}>
                    {error}
                </span>
            ) : null}
        </div>
    );
}
