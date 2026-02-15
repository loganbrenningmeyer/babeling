"use client";

import { useCallback, useEffect, useState } from "react";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";
import type { LibraryDocument } from "@/types/library";

// -------------------------
// UI Components
// -------------------------
import { Pane } from "@/app/components/Pane";
import { DocumentCard } from "@/app/components/Library/DocumentCard";

export default function Library() {
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

  useEffect(() => {
    if (!user) return;
    loadUserLibrary();
  }, [user, loadUserLibrary]);

  if (userLoading || loading) return <div className="px-12">Loading...</div>;
  if (userError || error)
    return <div className="px-12">Error: {userError ?? error}</div>;

  return (
    <div className="w-full px-12">
      <Pane title="Library" className="min-h-[80vh]" contentClassName="gap-4">
        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
            No documents yet. Start a reading session to save your first
            document.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </Pane>
    </div>
  );
}
