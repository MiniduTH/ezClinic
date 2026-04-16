"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface SessionUser {
  sub: string;
  email: string;
  name: string;
  role: string;
  [key: string]: unknown;
}

interface SessionContextValue {
  user: SessionUser | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextValue>({
  user: null,
  isLoading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <SessionContext.Provider value={{ user, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Client-side hook replacing useUser from @auth0/nextjs-auth0/client.
 */
export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

/** Alias for compatibility with existing code using useUser */
export function useUser(): SessionContextValue {
  return useSession();
}
