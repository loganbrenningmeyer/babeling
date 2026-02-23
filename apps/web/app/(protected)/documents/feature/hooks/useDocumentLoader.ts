"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDocumentById } from "../api/documents";
import type { LoadedDocument } from "../types/document";


/**************************
 * `useDocumentLoader()`
 * -- Fetches document data by documentId and returns the LoadedDocument
 * 
 * @param documentId - ID of document to load
 **************************/
export function useDocumentLoader(documentId: number | null) {
  const [document, setDocument] = useState<LoadedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning the race
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    if (documentId == null) return;

    // Track request order
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    // -------------------------
    // Get LoadedDocument by documentId
    // -------------------------
    try {
      const data = await getDocumentById(documentId);
      if (requestIdRef.current !== reqId) return;

      setDocument(data);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;

      setDocument(null);
      setError(e?.message ?? "Failed to load document");

    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [documentId]);

  // -------------------------
  // Run automatically when documentId changes
  // -------------------------
  useEffect(() => {
    void load();
  }, [load]);

  return {
    document,
    loading,
    error,
    reload: load,
  };
}