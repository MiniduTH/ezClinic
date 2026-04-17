"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";
import { useTheme } from "@/lib/theme-context";

// ---------------------------------------------------------------------------
// Breadcrumb path → label map
// ---------------------------------------------------------------------------
const PATH_LABELS: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Dashboard",
  "/profile": "Profile",
  "/doctors": "Find Doctors",
  "/appointments": "Appointments",
  "/availability": "Availability",
  "/prescriptions": "Prescriptions",
  "/reports": "Medical Reports",
  "/symptom-checker": "Symptom Checker",
  "/telemedicine": "Telemedicine",
  "/admin": "Admin Dashboard",
  "/admin/patients": "Manage Patients",
  "/admin/doctors": "Doctor Verification",
  "/doctor/verify": "Doctor Verification",
};

// ---------------------------------------------------------------------------
// Breadcrumb segments derived from the current pathname
// ---------------------------------------------------------------------------
function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  // Exact match first
  if (PATH_LABELS[pathname]) {
    const crumbs: { label: string; href: string }[] = [];
    if (pathname !== "/") crumbs.push({ label: PATH_LABELS["/"], href: "/" });
    crumbs.push({ label: PATH_LABELS[pathname], href: pathname });
    return crumbs;
  }

  // Walk up segments to build a trail
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [
    { label: PATH_LABELS["/"], href: "/" },
  ];
  let accumulated = "";
  for (const part of parts) {
    accumulated += "/" + part;
    const label = PATH_LABELS[accumulated] ?? part.charAt(0).toUpperCase() + part.slice(1);
    crumbs.push({ label, href: accumulated });
  }
  return crumbs;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Role badge colours
// ---------------------------------------------------------------------------
const ROLE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  admin: { bg: "var(--danger-surface)", text: "var(--danger-text)", label: "Admin" },
  doctor: { bg: "var(--brand-surface)", text: "var(--brand-text)", label: "Doctor" },
  patient: { bg: "var(--accent-surface)", text: "var(--accent)", label: "Patient" },
};

// ---------------------------------------------------------------------------
// Main Navbar component
// ---------------------------------------------------------------------------
export default function Navbar() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasNotification] = useState(true); // placeholder — replace with real data
  const dropdownRef = useRef<HTMLDivElement>(null);

  const role = getUserRole(user);
  const badge = ROLE_BADGE[role] ?? ROLE_BADGE.patient;
  const breadcrumbs = buildBreadcrumbs(pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Derive initials for avatar
  const initials = user
    ? (user.name || user.email || "U")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // continue regardless
    }
    window.location.href = "/login";
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: "64px",
        display: "flex",
        alignItems: "center",
        backgroundColor: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
          flexShrink: 0,
          fontFamily: "ui-monospace, 'Cascadia Code', monospace",
          fontSize: "1.25rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginRight: "24px",
        }}
      >
        <span style={{ color: "var(--brand)" }}>ez</span>
        <span style={{ color: "var(--text-primary)" }}>Clinic</span>
      </Link>

      {/* ── Breadcrumb (center, grows to fill space) ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span
              key={crumb.href}
              style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}
            >
              {index > 0 && (
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  <ChevronRightIcon />
                </span>
              )}
              {isLast ? (
                <span
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {/* ── Right actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        {/* Notification bell */}
        <button
          aria-label="Notifications"
          style={{
            position: "relative",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <BellIcon />
          {hasNotification && (
            <span
              style={{
                position: "absolute",
                top: "6px",
                right: "6px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#f59e0b",
                border: "2px solid var(--bg-elevated)",
              }}
            />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Avatar / dropdown — only shown when user is loaded */}
        {!isLoading && user && (
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              aria-label="Open user menu"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--brand)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                fontWeight: 700,
                fontSize: "0.8125rem",
                color: "#ffffff",
                letterSpacing: "0.02em",
              }}
            >
              {initials}
            </button>

            {/* Dropdown popover */}
            {dropdownOpen && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "240px",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  zIndex: 100,
                }}
              >
                {/* Header: name / email / role */}
                <div
                  style={{
                    padding: "16px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    {/* Mini avatar */}
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: "var(--brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "ui-monospace, 'Cascadia Code', monospace",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        color: "#ffffff",
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.name || "User"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 6px",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.email}
                      </p>
                      {/* Role badge */}
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.text,
                          textTransform: "capitalize",
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div style={{ padding: "8px" }}>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--bg-muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {/* User icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profile
                  </Link>

                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                      color: "var(--danger-text)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 500,
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--danger-surface)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {/* Log out icon */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Not logged in */}
        {!isLoading && !user && (
          <Link
            href="/login"
            style={{
              padding: "6px 16px",
              borderRadius: "8px",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#ffffff",
              backgroundColor: "var(--brand)",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
