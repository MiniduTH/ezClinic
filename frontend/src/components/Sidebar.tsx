"use client";
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { getUserRole } from '@/lib/roles';

export default function Sidebar() {
  const { user, isLoading } = useUser();
  
  if (isLoading || !user) return null; // Or a loading skeleton
  
  const role = getUserRole(user);

  let menuItems = [];
  
  if (role === 'admin') {
    menuItems = [
      { name: 'Admin Dashboard', path: '/admin', icon: '⚙️' },
      { name: 'All Patients', path: '/admin/patients', icon: '👤' },
    ];
  } else if (role === 'doctor') {
    menuItems = [
      { name: 'Dashboard', path: '/dashboard', icon: '📊' },
      { name: 'Appointments', path: '/appointments', icon: '📅' },
      { name: 'Prescriptions', path: '/prescriptions', icon: '💊' },
      { name: 'Availability', path: '/availability', icon: '🗓️' },
      { name: 'Telemedicine', path: '/telemedicine', icon: '📹' },
    ];
  } else {
    // Patient
    menuItems = [
      { name: 'My Profile', path: `/profile`, icon: '👤' },
      { name: 'Book Appointment', path: '/appointments', icon: '📅' },
    ];
  }

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform -translate-x-full bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700" aria-label="Sidebar">
      <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
        <ul className="space-y-2 font-medium">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path} className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-teal-50 dark:hover:bg-gray-700 group">
                <span className="text-xl">{item.icon}</span>
                <span className="ms-3">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
