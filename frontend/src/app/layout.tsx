import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/lib/session-context";
import { ThemeProvider } from "@/lib/theme-context";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ezClinic",
  description: "ezClinic – Smart Healthcare Platform",
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ezclinic-theme');var d=t||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider>
            <Navbar />
            <Sidebar />
            <AppShell>{children}</AppShell>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
