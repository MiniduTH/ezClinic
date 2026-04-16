"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/session-context';
import { getUserRole } from '@/lib/roles';

export default function Sidebar() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading || !user) return null;

  const role = getUserRole(user);

  let menuItems: { name: string; path: string; icon: string }[] = [];

  if (role === 'admin') {
    menuItems = [
      { name: 'Dashboard', path: '/admin', icon: '📊' },
      { name: 'Patients', path: '/admin/patients', icon: '👤' },
      { name: 'Doctor Verification', path: '/admin/doctors', icon: '🩺' },
    ];
  } else if (role === 'doctor') {
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: '📊' },
      { name: 'Appointments', path: '/appointments', icon: '📅' },
      { name: 'Prescriptions', path: '/prescriptions', icon: '💊' },
      { name: 'Availability', path: '/availability', icon: '🗓️' },
      { name: 'Telemedicine', path: '/telemedicine', icon: '📹' }
    ];
  } else {
    // Patient
    menuItems = [
      { name: 'My Profile', path: '/profile', icon: '👤' },
      { name: 'Find Doctors', path: '/doctors', icon: '🔍' },
      { name: 'Appointments', path: '/appointments', icon: '📅' },
      { name: 'Medical Reports', path: '/reports', icon: '📄' },
      { name: 'Prescriptions', path: '/prescriptions', icon: '💊' },
      { name: 'Symptom Checker', path: '/symptom-checker', icon: '🩺' },
    ];
  }

  const navContent = (
    <ul className="space-y-1 font-medium">
      {menuItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
        return (
          <li key={item.path}>
            <Link
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-gray-900 dark:text-white hover:bg-teal-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl" aria-hidden="true">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Mobile hamburger — visible below 768px */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileOpen}
        className="fixed bottom-4 left-4 z-50 sm:hidden flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {mobileOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        aria-label="Main navigation"
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto">
          {navContent}
        </div>
      </aside>
    </>
  );
}

