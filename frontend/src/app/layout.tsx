import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session-context";

export const metadata: Metadata = {
  title: "ezClinic",
  description: "ezClinic – Smart Healthcare Platform",
};

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased bg-gray-50 font-sans"
      >
        <SessionProvider>
          <Navbar />
          <Sidebar />
          <div className="p-4 sm:ml-64 mt-14">
            <main className="min-h-screen">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
