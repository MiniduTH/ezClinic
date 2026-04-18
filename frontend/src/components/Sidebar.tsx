"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/session-context";
import { getUserRole } from "@/lib/roles";

const SIDEBAR_COLLAPSED_KEY = "ezclinic-sidebar-collapsed";
const SIDEBAR_W_EXPANDED  = "240px";
const SIDEBAR_W_COLLAPSED = "64px";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
function IconHome()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconCalendar() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function IconUser()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function IconUsers()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IconFileText() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IconPill()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="4"/><path d="m15.5 15.5 5 5"/></svg>; }
function IconClock()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function IconVideo()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>; }
function IconSearch() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconActivity() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>; }
function IconGrid()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function IconBadgeCheck() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="m9 12 2 2 4-4"/></svg>; }
function IconChevronsLeft()  { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>; }
function IconChevronsRight() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>; }
function IconMenu()  { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function IconClose() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

// ---------------------------------------------------------------------------
// Nav items
// ---------------------------------------------------------------------------
interface NavItem { name: string; path: string; icon: React.ReactNode; }

function getNavItems(role: string): NavItem[] {
  if (role === "admin") return [
    { name: "Dashboard",          path: "/admin",          icon: <IconGrid /> },
    { name: "Patients",           path: "/admin/patients", icon: <IconUsers /> },
    { name: "Doctor Verification",path: "/admin/doctors",  icon: <IconBadgeCheck /> },
  ];
  if (role === "doctor") return [
    { name: "Dashboard",    path: "/dashboard",    icon: <IconHome /> },
    { name: "Appointments", path: "/appointments", icon: <IconCalendar /> },
    { name: "Prescriptions",path: "/prescriptions",icon: <IconPill /> },
    { name: "Availability", path: "/availability", icon: <IconClock /> },
    { name: "Telemedicine", path: "/telemedicine", icon: <IconVideo /> },
  ];
  return [
    { name: "Profile",        path: "/profile",         icon: <IconUser /> },
    { name: "Find Doctors",   path: "/doctors",         icon: <IconSearch /> },
    { name: "Appointments",   path: "/appointments",    icon: <IconCalendar /> },
    { name: "Medical Reports",path: "/reports",         icon: <IconFileText /> },
    { name: "Prescriptions",  path: "/prescriptions",   icon: <IconPill /> },
    { name: "Symptom Checker",path: "/symptom-checker", icon: <IconActivity /> },
  ];
}

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  admin:   { bg: "var(--danger-surface)",  text: "var(--danger-text)"  },
  doctor:  { bg: "var(--brand-surface)",   text: "var(--brand-text)"   },
  patient: { bg: "var(--accent-surface)",  text: "var(--accent)"       },
};

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export default function Sidebar() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const [collapsed, setCollapsed]             = useState(false);
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      const isCollapsed = stored === "true";
      setCollapsed(isCollapsed);
      document.documentElement.style.setProperty("--sidebar-w", isCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
    } catch { /* SSR safety */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileViewport(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", update); else mq.removeListener(update); };
  }, []);

  useEffect(() => { if (!isMobileViewport) setMobileOpen(false); }, [isMobileViewport]);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.style.setProperty("--sidebar-w", next ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch { /* ignore */ }
  }

  const isPublicRoute = pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register") || pathname.startsWith("/admin-login");
  if (isPublicRoute || isLoading || !user) return null;

  const role     = getUserRole(user);
  const navItems = getNavItems(role);
  const badge    = ROLE_BADGE[role] ?? ROLE_BADGE.patient;

  const initials = (user.name || user.email || "U").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  // ── Section label ──────────────────────────────────────────────────────────
  function SectionLabel({ label }: { label: string }) {
    return (
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, fontFamily: "'Manrope', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "8px 12px 4px", margin: 0 }}>
        {label}
      </p>
    );
  }

  // ── Sidebar content ────────────────────────────────────────────────────────
  function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
    const showText = !collapsed || isMobile;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

        {/* Nav items */}
        <nav aria-label="Main navigation" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 8px 0" }}>
          {showText && <SectionLabel label="Navigation" />}
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    title={collapsed && !isMobile ? item.name : undefined}
                    onClick={() => { if (isMobile) setMobileOpen(false); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: showText ? "10px" : "0",
                      padding: showText ? "9px 12px" : "10px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: isActive ? 600 : 400,
                      fontFamily: isActive ? "'Manrope', sans-serif" : "'Inter', sans-serif",
                      fontSize: "0.875rem",
                      color: isActive ? "var(--brand-text)" : "var(--text-secondary)",
                      background: isActive ? "var(--brand-surface)" : "transparent",
                      borderLeft: isActive ? "3px solid var(--brand)" : "3px solid transparent",
                      transition: "background-color 150ms, color 150ms, border-color 150ms",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      justifyContent: showText ? "flex-start" : "center",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-muted)";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    <span style={{ flexShrink: 0, display: "flex", alignItems: "center", opacity: isActive ? 1 : 0.75 }}>
                      {item.icon}
                    </span>
                    {showText && (
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom: user card + collapse toggle */}
        <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", padding: "10px 8px" }}>

          {/* User card */}
          {showText ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                marginBottom: "6px",
                borderRadius: "8px",
                background: "var(--bg-muted)",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  letterSpacing: "0.02em",
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, fontFamily: "'Manrope', sans-serif", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "User"}
                </p>
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "2px",
                    padding: "1px 7px",
                    borderRadius: "999px",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    background: badge.bg,
                    color: badge.text,
                  }}
                >
                  {role}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }} title={user?.name || "User"}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  color: "#ffffff",
                }}
              >
                {initials}
              </div>
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "7px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 500,
                transition: "background-color 150ms, color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-muted)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >
              {collapsed ? <IconChevronsRight /> : <IconChevronsLeft />}
              {!collapsed && <span>Collapse</span>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile FAB */}
      {isMobileViewport && (
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 60,
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "var(--brand)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            cursor: "pointer",
            boxShadow: "var(--shadow-brand)",
            transition: "background-color 150ms, transform 100ms",
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          className="block sm:hidden"
        >
          {mobileOpen ? <IconClose /> : <IconMenu />}
        </button>
      )}

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 49,
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          className="sm:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        aria-label="Mobile navigation"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: "264px",
          background: "var(--bg-elevated)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 220ms cubic-bezier(0.4,0,0.2,1)",
          paddingTop: "64px",
        }}
        className="sm:hidden"
      >
        <SidebarContent isMobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        aria-label="Main navigation"
        style={{
          position: "fixed",
          top: "64px",
          left: 0,
          bottom: 0,
          zIndex: 40,
          width: "var(--sidebar-w, 240px)",
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
        className="hidden sm:block"
      >
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}
