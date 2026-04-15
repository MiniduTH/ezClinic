import type { Metadata } from "next";
import "./globals.css";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";

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
        <Auth0Provider>
          <Navbar />
          <Sidebar />
          <div className="p-4 sm:ml-64 mt-14">
            <main className="min-h-screen">
              {children}
            </main>
          </div>
        </Auth0Provider>
      </body>
    </html>
  );
}
