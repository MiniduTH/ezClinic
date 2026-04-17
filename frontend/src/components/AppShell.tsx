"use client";

import { useUser } from "@/lib/session-context";
import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/register", "/admin-login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isAuthPage || (!isLoading && !user)) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div
      className="min-h-screen pt-16 transition-[padding] duration-200"
      style={{ paddingLeft: "var(--sidebar-w, 240px)" }}
    >
      <main className="mx-auto max-w-[1200px] px-6 py-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
