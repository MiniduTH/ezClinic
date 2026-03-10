"use client";
import Link from 'next/link';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Patients', path: '/patients', icon: '👤' },
    { name: 'Doctors', path: '/doctors', icon: '🩺' },
    { name: 'Appointments', path: '/appointments', icon: '📅' },
    { name: 'Telemedicine', path: '/telemedicine', icon: '📹' },
    { name: 'Admin', path: '/admin', icon: '⚙️' },
  ];

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
