"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPageTranslation } from "../api/pageTranslations";
import type { PageTranslation } from "../types/pageTranslation";

/**************************
 * `useSavedPageTranslation()`
 * -- Fetches saved page translation data by documentId / src/tgtLangs and returns the data
 * 
 * @param documentId - ID of document to load translations from
 * @param srcLang - Source language for translation (same as document)
 * @param tgtLang - Target language of translation (can be multiple per document in database)
 **************************/
export function useSavedPageTranslation(args: {
  documentPageId: number | null;
  srcLang: string | null;
  tgtLang: string | null;
}) {
  const { documentPageId, srcLang, tgtLang } = args;

  const [translation, setTranslation] = useState<PageTranslation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning the race
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    // If we don't have enough info, reset to idle state
    if (!documentPageId || !srcLang || !tgtLang) {
      setTranslation(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Track request order
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    // -------------------------
    // Get saved PageTranslation by documentId, src/tgtLangs
    // -------------------------
    try {
      const result = await getPageTranslation({
        documentPageId,
        srcLang,
        tgtLang,
      });

      // Ignore if a newer request started
      if (requestIdRef.current !== reqId) return;

      // Result is either PageTranslation or null (404)
      setTranslation(result);
    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      setTranslation(null);
      setError(e?.message ?? "Failed to load saved translation");
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [documentPageId, srcLang, tgtLang]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    translation,
    loading,
    error,
    reload: load,
  };
}