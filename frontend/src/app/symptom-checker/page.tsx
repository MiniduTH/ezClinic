"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, Activity, AlertTriangle, CheckCircle, Info } from "lucide-react";

type Severity = "LOW" | "MEDIUM" | "HIGH";

interface RawSymptomResult {
    aiSuggestion?: unknown;
    recommendation?: string;
    recommendedAction?: string;
    severity?: string;
    possibleConditions?: unknown;
    disclaimer?: string;
}

interface SymptomResult {
    severity?: Severity;
    recommendation: string;
    possibleConditions: string[];
    disclaimer: string;
}

export default function SymptomCheckerPage() {
    const [symptoms, setSymptoms] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SymptomResult | null>(null);

    const normalizeResult = (input: unknown): SymptomResult => {
        const parsed = (input && typeof input === "object" ? input : {}) as RawSymptomResult;
        const possibleConditions = Array.isArray(parsed.possibleConditions)
            ? parsed.possibleConditions.filter((condition): condition is string => typeof condition === "string")
            : [];
        const severity = parsed.severity === "LOW" || parsed.severity === "MEDIUM" || parsed.severity === "HIGH" ? parsed.severity : undefined;

        return {
            severity,
            recommendation: parsed.recommendation || parsed.recommendedAction || "No recommendation provided.",
            possibleConditions,
            disclaimer:
                parsed.disclaimer ||
                "This is an AI-generated assessment and does not constitute medical advice. Please consult a healthcare professional for an accurate diagnosis.",
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
        for (let i = 0; i < 3; i += 1) {
            if (typeof current === "string") {
                const raw = stripCodeFences(current);
                try {
                    current = JSON.parse(raw);
                    continue;
                } catch {
                    return {
                        recommendation: raw,
                    };
                }
            }

            if (current && typeof current === "object" && "aiSuggestion" in (current as RawSymptomResult)) {
                current = (current as RawSymptomResult).aiSuggestion;
                continue;
            }

            break;
        }

        return current;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!symptoms.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/symptom-check", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ symptoms }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to check symptoms");
            }

            // Backend returns { id, patientId, symptoms, aiSuggestion: "<json string>", createdAt }
            // Parse aiSuggestion and normalize older/newer AI response shapes.
            let parsedResult: SymptomResult;
            try {
                const resolvedPayload = parseSuggestionPayload(data.aiSuggestion ?? data);
                parsedResult = normalizeResult(resolvedPayload);
            } catch {
                throw new Error("Could not parse AI response. Please try again.");
            }
            setResult(parsedResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity: Severity) => {
        switch (severity) {
            case "LOW":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle className="w-4 h-4" /> LOW
                    </span>
                );
            case "MEDIUM":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-4 h-4" /> MEDIUM
                    </span>
                );
            case "HIGH":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                        <Activity className="w-4 h-4" /> HIGH
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">AI Symptom Checker</h1>
                <p className="mt-4 text-lg text-gray-500">
                    Describe your symptoms below, and our AI will provide initial guidance. Please be as detailed as possible.
                </p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
                                What are you experiencing?
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="symptoms"
                                    name="symptoms"
                                    rows={4}
                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border"
                                    placeholder="e.g., I have had a headache for two days and a mild fever..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-sm border-red-400 text-red-700">{error}</p>
                            </div>
                        )}

                        <div className="mt-5 text-right">
                            <button
                                type="submit"
                                disabled={loading || !symptoms.trim()}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {loading ? "Analyzing..." : "Check Symptoms"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {result && (
                <div className="mt-8 bg-white shadow rounded-lg overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Analysis Result</h3>
                        {result.severity ? getSeverityBadge(result.severity) : null}
                    </div>

                    <div className="px-4 py-5 sm:p-6 space-y-6">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
                            <div className="flex">
                                <div className="shrink-0">
                                    <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">Recommendation</h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>{result.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Possible Conditions</h4>
                            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {result.possibleConditions?.map((condition, index) => (
                                    <li
                                        key={index}
                                        className="col-span-1 bg-gray-50 rounded-md p-3 border border-gray-100 shadow-sm flex items-center"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                                        <span className="text-sm text-gray-700">{condition}</span>
                                    </li>
                                ))}
                            </ul>
                            {(!result.possibleConditions || result.possibleConditions.length === 0) && (
                                <p className="text-sm text-gray-500 italic">No specific conditions identified.</p>
                            )}
                        </div>

                        <div className="pt-4 mt-6 border-t border-gray-200">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <p className="text-xs text-gray-500 flex items-start gap-1 max-w-lg">
                                    <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>
                                        {result.disclaimer ||
                                            "This is an AI-generated assessment and does not constitute medical advice. Please consult a healthcare professional for an accurate diagnosis."}
                                    </span>
                                </p>

                                {result.severity === "HIGH" ? (
                                    <div className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 cursor-not-allowed">
                                        Seek Emergency Care
                                    </div>
                                ) : (
                                    <Link
                                        href={`/appointments/new?symptoms=${encodeURIComponent(symptoms)}`}
                                        className="inline-flex shrink-0 items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                    >
                                        Book Appointment
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
