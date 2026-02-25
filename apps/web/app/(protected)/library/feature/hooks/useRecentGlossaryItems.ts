"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecentGlossaryItems } from "../api/library";
import { LibraryGlossaryItem } from "../types/library";


/**************************
 * `useRecentGlossaryItems()`
 * -- Hook to fetch user's recently saved glossary items up to a limit count
 **************************/
export function useRecentGlossaryItems(args?: { limit?: number }) {
  const limit = args?.limit ?? 10;

  const [glossaryItems, setGlossaryItems] = useState<LibraryGlossaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await getRecentGlossaryItems({ limit });

      if (requestIdRef.current !== reqId) return;
      setGlossaryItems(res.glossaryItems);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      setGlossaryItems([]);
      setError(e?.message ?? "Failed to load recent glossary items");

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
    glossaryItems,
    loading,
    error,
    reload: load,
  };
}