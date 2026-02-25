"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecentTranslations } from "../api/translations";
import { LibraryTranslation } from "../types/translation";

/**************************
 * `useRecentTranslations()`
 * -- Hook to fetch user's recently saved translations for a given document ID
 **************************/
export function useRecentTranslations(args: {
  documentId: number;
  limit?: number | null;
}) {
  const { documentId } = args;
  const limit = args.limit ?? null;

  const [translations, setTranslations] = useState<LibraryTranslation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getRecentTranslations({ documentId, limit });

      if (requestIdRef.current !== reqId) return;
      setTranslations(res.translations);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      setTranslations([]);
      setError(e?.message ?? "Failed to load recent translations");

    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [documentId, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    translations,
    loading,
    error,
    reload: load,
  };
}