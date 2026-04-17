"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";

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
const SESSION_ENDPOINT = "/api/auth/session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(SESSION_ENDPOINT);
      const data = response.ok ? await response.json() : null;
      setUser(data?.user ?? null);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`Failed to refresh session from ${SESSION_ENDPOINT}`, error);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const handleSessionChange = () => {
      void refreshSession();
    };
    window.addEventListener("ezclinic:session-changed", handleSessionChange);
    return () => {
      window.removeEventListener("ezclinic:session-changed", handleSessionChange);
    };
  }, [refreshSession]);

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
