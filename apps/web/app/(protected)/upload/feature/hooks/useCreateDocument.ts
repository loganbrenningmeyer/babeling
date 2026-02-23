"use client";

import { useCallback, useRef, useState } from "react";
import { createDocument } from "../api/documents";

type CreateDocumentArgs = {
  title: string;
  srcLang: string;
  text: string;
};

/**************************
 * `useCreateDocument()`
 * -- Saves document to database given the title, srcLang, and text
 **************************/
export function useCreateDocument() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);

  const create = useCallback(async (args: CreateDocumentArgs) => {
    const reqId = ++requestIdRef.current;
    setCreating(true);
    setError(null);

    try {
      const res = await createDocument(args);

      // Stale guard
      if (requestIdRef.current !== reqId) return null;

      return res; // { documentId }

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return null;

      setError(e?.message ?? "Failed to create document");
      return null;

    } finally {
      if (requestIdRef.current === reqId) {
        setCreating(false);
      }
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return { create, creating, error, resetError };
}