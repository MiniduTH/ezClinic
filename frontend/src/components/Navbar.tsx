"use client";
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start rtl:justify-end">
            <Link href="/" className="flex ms-2 md:me-24">
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white text-teal-600">ezClinic</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">{user.name || user.email}</span>
                 <a
                  href="/auth/logout"
                  className="text-sm px-3 py-1.5 rounded-md bg-teal-500 text-white hover:bg-teal-600 transition-colors"
                >
                  Logout
                </a>
                <div className="flex items-center ms-1">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name ?? 'User'} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold">
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </>
            ) : !isLoading ? (
              <a href="/auth/login?returnTo=/" className="text-sm px-3 py-1.5 rounded-md bg-teal-500 text-white hover:bg-teal-600 transition-colors">
                Login
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
