"use client";

import { useCallback, useEffect, useState } from "react";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";
import type { LibraryDocument } from "./feature/types/library";

// -------------------------
// UI Components
// -------------------------
import { Pane } from "@/app/components/Pane";
import { LibrarySkeleton } from "@/app/(protected)/library/feature/components/LibrarySkeleton";
import { LibraryDataTable } from "@/app/(protected)/library/feature/components/LibraryDataTable";

export default function LibraryTable() {
  // -------------------------
  // Load user information
  // -------------------------
  const { user, loading: userLoading, error: userError } = useAppUser();

  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Load user library
  // -------------------------
  const loadUserLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/library", {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error ?? "Failed to load library");
      setDocs(data.documents ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // -------------------------
  // Refresh user library on new user
  // -------------------------
  useEffect(() => {
    if (!user) return;
    loadUserLibrary();
  }, [user, loadUserLibrary]);

  // -------------------------
  // Library Loading Skeleton
  // -------------------------
  if (userLoading || loading) {
    return (
      <div className="p-4">
        <LibrarySkeleton />
      </div>
    );
  }

  if (userError || error) {
    return <div className="px-12">Error: {userError ?? error}</div>;
  }

  return (
    <div className="p-4">
      {docs.length === 0 ? (
        <div className="
          rounded-xl 
          border border-dashed bg-muted/40 p-8 
          font-ui text-sm text-muted-foreground
        ">
          No documents yet. Start a reading session to save your first
          document.
        </div>
      ) : (
        <LibraryDataTable docs={docs} />
      )}
    </div>
  );
}
