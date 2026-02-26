"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getRecentTranslations } from "../api/translations";
import { LibraryTranslation } from "../types/translation";

const recentTranslationsCache = new Map<string, LibraryTranslation[]>();

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
  const cacheKey = `${documentId}:${limit ?? "all"}`;

  const [translations, setTranslations] = useState<LibraryTranslation[]>(
    () => recentTranslationsCache.get(cacheKey) ?? []
  );
  const [loading, setLoading] = useState<boolean>(
    () => !recentTranslationsCache.has(cacheKey)
  );
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const reqId = ++requestIdRef.current;
    const hasCached = recentTranslationsCache.has(cacheKey);

    if (!hasCached) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await getRecentTranslations({ documentId, limit });

      if (requestIdRef.current !== reqId) return;

      recentTranslationsCache.set(cacheKey, res.translations);
      setTranslations(res.translations);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      if (!hasCached) {
        setTranslations([]);
      }
      setError(e?.message ?? "Failed to load recent translations");

    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [cacheKey, documentId, limit]);

  useEffect(() => {
    const cached = recentTranslationsCache.get(cacheKey);
    setTranslations(cached ?? []);
    setLoading(cached == null);
    setError(null);
  }, [cacheKey]);

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
