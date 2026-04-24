"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Severity = "LOW" | "MEDIUM" | "HIGH";

interface RawSymptomResult {
    aiSuggestion?: unknown;
    data?: unknown;
    output?: unknown;
    response?: unknown;
    result?: unknown;
    recommendationText?: unknown;
    recommendation?: string;
    recommendedAction?: string;
    recommended_action?: unknown;
    severity?: string;
    riskLevel?: unknown;
    risk_level?: unknown;
    possibleConditions?: unknown;
    possible_conditions?: unknown;
    conditions?: unknown;
    potentialConditions?: unknown;
    potential_conditions?: unknown;
    disclaimer?: string;
}

interface SymptomResult {
    severity?: Severity;
    recommendation: string;
    possibleConditions: string[];
    disclaimer: string;
}

type Message = {
    role: "patient" | "ai";
    content: string;
    result?: SymptomResult;
};

function asObject(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getField(input: object, keys: string[]): unknown {
    const record = input as Record<string, unknown>;

    for (const key of keys) {
        if (key in record) return record[key];
    }

    const byLower = new Map<string, unknown>();
    for (const [k, v] of Object.entries(record)) {
        byLower.set(k.toLowerCase(), v);
    }

    for (const key of keys) {
        const hit = byLower.get(key.toLowerCase());
        if (hit !== undefined) return hit;
    }

    return undefined;
}

function coerceString(value: unknown): string {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
}

function extractRecommendation(value: unknown): string {
    if (typeof value === "string") return value.trim();

    if (Array.isArray(value)) {
        const flattened = value.map((entry) => extractRecommendation(entry)).filter(Boolean);
        return flattened.join(" ").trim();
    }

    const obj = asObject(value);
    if (Object.keys(obj).length === 0) return "";

    const preferred = [
        "recommendation",
        "recommendations",
        "recommendedAction",
        "recommended_action",
        "recommendationText",
        "action",
        "advice",
        "summary",
        "guidance",
        "nextSteps",
        "next_steps",
        "message",
        "text",
        "result",
        "output",
        "response",
        "analysis",
    ];

    for (const key of preferred) {
        const candidate = getField(obj, [key]);
        const extracted = extractRecommendation(candidate);
        if (extracted) return extracted;
    }

    const generic = Object.values(obj)
        .map((entry) => extractRecommendation(entry))
        .filter(Boolean)
        .join(" ")
        .trim();

    return generic;
}

function tryParseEscapedJson(raw: string): unknown | undefined {
    const trimmed = raw.includes("```json")
        ? raw.split("```json")[1].split("```")[0].trim()
        : raw.includes("```")
          ? raw.split("```")[1].split("```")[0].trim()
          : raw.trim();
    const attempts = new Set<string>();

    attempts.add(trimmed);

    const maybeUnquoted =
        (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")) ? trimmed.slice(1, -1) : trimmed;
    attempts.add(maybeUnquoted);

    const slashDecoded = maybeUnquoted
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\\//g, "/")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");
    attempts.add(slashDecoded);

    for (const attempt of attempts) {
        if (!attempt) continue;
        try {
            return JSON.parse(attempt);
        } catch {
            // Try next transform
        }
    }

    return undefined;
}

function normalizeSeverity(value: unknown): Severity | undefined {
    const raw = coerceString(value).toUpperCase();
    if (!raw) return undefined;

    if (["LOW", "MILD", "MINOR"].includes(raw)) return "LOW";
    if (["MEDIUM", "MODERATE"].includes(raw)) return "MEDIUM";
    if (["HIGH", "SEVERE", "URGENT", "CRITICAL"].includes(raw)) return "HIGH";

    return undefined;
}

function normalizeConditions(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value
            .map((item) => coerceString(item))
            .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/\n|,|\u2022|;/)
            .map((item) => item.replace(/^[-*\d.)\s]+/, "").trim())
            .filter(Boolean);
    }

    return [];
}

export default function SymptomCheckerPage() {
    const [symptoms, setSymptoms] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const normalizeResult = (input: unknown): SymptomResult => {
        const parsed = asObject(input) as RawSymptomResult;

        const recommendation =
            extractRecommendation(
                getField(parsed, [
                    "recommendation",
                    "recommendedAction",
                    "recommended_action",
                    "recommendationText",
                    "result",
                    "output",
                    "response",
                    "data",
                    "aiSuggestion",
                ]),
            ) || "No recommendation provided.";

        const severity = normalizeSeverity(getField(parsed, ["severity", "riskLevel", "risk_level", "urgency", "priority"])) || undefined;

        const possibleConditions = normalizeConditions(
            getField(parsed, ["possibleConditions", "possible_conditions", "conditions", "potentialConditions", "potential_conditions"]),
        );

        const disclaimer =
            coerceString(getField(parsed, ["disclaimer", "medicalDisclaimer", "medical_disclaimer", "note"])) ||
            "This is an AI-generated assessment and does not constitute medical advice. Please consult a healthcare professional for an accurate diagnosis.";

        return {
            severity,
            recommendation,
            possibleConditions,
            disclaimer,
        };
    };

    const stripCodeFences = (value: string): string => {
        if (value.includes("```json")) {
            return value.split("```json")[1].split("```")[0].trim();
        }
        if (value.includes("```")) {
            return value.split("```")[1].split("```")[0].trim();
        }
        return value.trim();
    };

    const parseSuggestionPayload = (payload: unknown): unknown => {
        let current: unknown = payload;

        // Unwrap nested encoded structures (stringified JSON, wrapped aiSuggestion object)
        for (let i = 0; i < 6; i += 1) {
            if (typeof current === "string") {
                const raw = stripCodeFences(current);
                const parsed = tryParseEscapedJson(raw);
                if (parsed !== undefined) {
                    current = parsed;
                    continue;
                }

                return {
                    recommendation: raw,
                };
            }

            if (current && typeof current === "object") {
                const obj = current as RawSymptomResult;
                const nested = obj.aiSuggestion ?? obj.data ?? obj.output ?? obj.response ?? obj.result;

                if (nested !== undefined && nested !== current) {
                    current = nested;
                    continue;
                }
            }

            break;
        }

        return current;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symptoms.trim() || loading) return;

        const userText = symptoms.trim();
        setMessages((prev) => [...prev, { role: "patient", content: userText }]);
        setSymptoms("");
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/symptom-check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symptoms: userText }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to check symptoms");
            }

            let parsedResult: SymptomResult;
            try {
                const resolvedPayload = parseSuggestionPayload(data.aiSuggestion ?? data);
                parsedResult = normalizeResult(resolvedPayload);
            } catch {
                throw new Error("Could not parse AI response. Please try again.");
            }

            setMessages((prev) => [...prev, { role: "ai", content: parsedResult.recommendation, result: parsedResult }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
            // Remove the typing indicator by not adding an AI message
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity: Severity) => {
        const map: Record<Severity, { bg: string; color: string; border: string; label: string; icon: string }> = {
            LOW: {
                bg: "var(--success-surface)",
                color: "var(--success-text)",
                border: "var(--success-border)",
                label: "LOW RISK",
                icon: "✓",
            },
            MEDIUM: {
                bg: "var(--warning-surface)",
                color: "var(--warning-text)",
                border: "var(--warning-border)",
                label: "MEDIUM RISK",
                icon: "⚠",
            },
            HIGH: {
                bg: "var(--danger-surface)",
                color: "var(--danger-text)",
                border: "var(--danger-border)",
                label: "HIGH RISK",
                icon: "!",
            },
        };
        const s = map[severity];
        return (
            <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                    background: s.bg,
                    color: s.color,
                    border: `1px solid ${s.border}`,
                }}
            >
                {s.icon} {s.label}
            </span>
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">AI Symptom Checker</h1>
                        <p className="page-subtitle">Describe your symptoms and our AI will provide initial guidance.</p>
                    </div>
                    <span className="badge badge-brand">AI-powered</span>
                </div>

                {/* Chat container */}
                <div
                    className="glass-card-premium flex flex-col gap-3 p-5 overflow-y-auto"
                    style={{
                        minHeight: "420px",
                        maxHeight: "600px",
                    }}
                >
                    {messages.length === 0 && !loading && (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                                <div className="empty-state-title">Tell me what you&apos;re experiencing</div>
                                <div className="empty-state-desc">Type your symptoms below in plain language. The more detail you give, the better the guidance.</div>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => {
                        if (msg.role === "patient") {
                            return (
                                <div key={idx} className="flex justify-end">
                                    <div
                                        className="max-w-[75%] px-4 py-3 text-sm"
                                        style={{
                                            background: "var(--brand)",
                                            color: "#ffffff",
                                            borderRadius: "18px 18px 4px 18px",
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            );
                        }

                        // AI message
                        const result = msg.result;
                        return (
                            <div key={idx} className="flex items-start gap-3">
                                {/* Avatar */}
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                    style={{
                                        background: "var(--brand-surface)",
                                        color: "var(--brand-text)",
                                        fontFamily: "ui-monospace, monospace",
                                    }}
                                >
                                    ez
                                </div>
                                {/* Bubble */}
                                <div
                                    className="max-w-[80%] px-4 py-3 text-sm space-y-2"
                                    style={{
                                        background: "var(--bg-muted)",
                                        color: "var(--text-primary)",
                                        borderRadius: "4px 18px 18px 18px",
                                    }}
                                >
                                    {result?.severity && <div>{getSeverityBadge(result.severity)}</div>}
                                    <p style={{ lineHeight: "1.6" }}>{msg.content}</p>

                                    {result?.possibleConditions && result.possibleConditions.length > 0 && (
                                        <div>
                                            <p
                                                className="text-xs font-semibold uppercase tracking-wider mb-1.5"
                                                style={{ color: "var(--text-muted)" }}
                                            >
                                                Possible Conditions
                                            </p>
                                            <ul className="space-y-1">
                                                {result.possibleConditions.map((c, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-center gap-2 text-xs"
                                                        style={{ color: "var(--text-secondary)" }}
                                                    >
                                                        <span
                                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                            style={{ background: "var(--brand)" }}
                                                        />
                                                        {c}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {result?.disclaimer && (
                                        <p
                                            className="text-xs pt-1 border-t"
                                            style={{
                                                color: "var(--text-muted)",
                                                borderColor: "var(--border)",
                                            }}
                                        >
                                            {result.disclaimer}
                                        </p>
                                    )}

                                    {result && (
                                        <div className="pt-1">
                                            {result.severity === "HIGH" ? (
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                    style={{
                                                        background: "var(--danger-surface)",
                                                        color: "var(--danger-text)",
                                                    }}
                                                >
                                                    ⚠ Seek Emergency Care Immediately
                                                </span>
                                            ) : (
                                                <Link
                                                    href={`/appointments`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                                                    style={{
                                                        background: "var(--brand-surface)",
                                                        color: "var(--brand-text)",
                                                    }}
                                                >
                                                    Book an Appointment →
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                style={{
                                    background: "var(--brand-surface)",
                                    color: "var(--brand-text)",
                                    fontFamily: "ui-monospace, monospace",
                                }}
                            >
                                ez
                            </div>
                            <div
                                className="px-4 py-3 flex items-center gap-1.5"
                                style={{
                                    background: "var(--bg-muted)",
                                    borderRadius: "4px 18px 18px 18px",
                                    minWidth: 60,
                                }}
                            >
                                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "var(--text-muted)" }} />
                                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "var(--text-muted)" }} />
                                <span className="typing-dot w-2 h-2 rounded-full inline-block" style={{ background: "var(--text-muted)" }} />
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="px-4 py-3 rounded-xl text-sm border"
                        style={{
                            background: "var(--danger-surface)",
                            borderColor: "var(--danger-border)",
                            color: "var(--danger-text)",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Input area */}
                <form onSubmit={handleSubmit} className="flex items-end gap-3">
                    <textarea
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        placeholder="Describe your symptoms… (Enter to send, Shift+Enter for new line)"
                        disabled={loading}
                        className="flex-1 resize-none rounded-xl px-4 py-3 text-sm outline-none"
                        style={{
                            border: "1px solid var(--border)",
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            lineHeight: "1.5",
                        }}
                    />
                    <button
                        type="submit"
                        disabled={loading || !symptoms.trim()}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                        style={{
                            background: "var(--brand)",
                            color: "#ffffff",
                        }}
                        aria-label="Send"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>

                {/* Disclaimer */}
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    AI-generated guidance only — not a substitute for professional medical advice.
                </p>
            </div>
        </div>
    );
}
