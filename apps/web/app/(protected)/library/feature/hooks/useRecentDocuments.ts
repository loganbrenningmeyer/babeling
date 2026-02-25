"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecentDocuments } from "@/app/(protected)/library/feature/api/documents";
import type { LibraryDocument } from "@/app/(protected)/library/feature/types/document";


/**************************
 * `useRecentDocuments()`
 * -- Hook to fetch all of user's library documents
 **************************/
export function useRecentDocuments(args?: { limit?: number | null }) {
  const limit = args?.limit ?? null;

  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getRecentDocuments({ limit });

      if (requestIdRef.current !== reqId) return;
      setDocuments(res.documents);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      setDocuments([]);
      setError(e?.message ?? "Failed to load recent documents");

    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    documents,
    loading,
    error,
    reload: load,
  };
}