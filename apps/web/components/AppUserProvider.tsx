"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiFetch } from "@/lib/api";

// -------------------------
// Stores user info from API/me
// -- {id, clerkUserId, lastSeenAt}
// -------------------------
export type AppUser = {
  id: number;
  clerkUserId: string;
  lastSeenAt: string | null;
};

type AppUserState = {
  user: AppUser | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const AppUserContext = createContext<AppUserState | null>(null);


export function AppUserProvider( { children }: { children: React.ReactNode }) {
  // -------------------------
  // Clerk useAuth()
  // -- isSignedIn (boolean): Whether user is logged in
  // -- getToken(): Gets backend JWT info
  // -------------------------
  const { isSignedIn, getToken } = useAuth();

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Refreshes Clerk user info if isSignedIn or getToken() change
  // -------------------------
  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // -------------------------
    // Get user info from Clerk
    // -------------------------
    try {
      const token = await getToken({ template: "backend" });
      if (!token) throw new Error("No Clerk token returned");

      // -------------------------
      // /me: Returns {id, clerkUserId, lastSeenAt}
      // -------------------------
      const res = await apiFetch("/me", token);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }

      const data = JSON.parse(text) as AppUser;
      setUser(data);
    } catch (e: any) {
      setUser(null);
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn]);

  // -------------------------
  // Load once when signed-in state changes
  // -------------------------
  useEffect(() => {
    refresh();
  }, [refresh]);

  // -------------------------
  // Only recreate user values if user | loading | error | refresh change
  // -------------------------
  const value = useMemo<AppUserState>(
    () => ({ user, loading, error, refresh }),
    [user, loading, error, refresh]
  );

  return (
    <AppUserContext.Provider value={value}>
      {children}
    </AppUserContext.Provider>
  );
}


// -------------------------
// Returns AppUserContext value from nearest parent Provider
// -- useContext(): Must be called from child within <AppUserProvider>
// -------------------------
export function useAppUser() {
  const ctx = useContext(AppUserContext);
  if (!ctx) throw new Error("useAppUser must be used within <AppUserProvider>");
  return ctx;
}