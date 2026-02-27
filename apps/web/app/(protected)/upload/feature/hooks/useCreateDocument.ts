"use client";

import { useCallback, useRef, useState } from "react";
import { createTextDocument, createFileDocument } from "../api/documents";


export type CreateDocumentInput = {
  title: string;
  srcLang: string;
  source:
    | { kind: "text"; text: string }
    | { kind: "file"; file: File };
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

  const create = useCallback(async (args: CreateDocumentInput) => {
    const reqId = ++requestIdRef.current;
    setCreating(true);
    setError(null);

    try {
      // -------------------------
      // ( Raw Text )
      // -------------------------
      if (args.source.kind === "text") {
        const res = await createTextDocument({
          title: args.title,
          srcLang: args.srcLang,
          text: args.source.text,
        });
        
        // Stale guard
        if (requestIdRef.current !== reqId) return null;
        
        return res; // { documentId }
      }

      // -------------------------
      // ( File )
      // -------------------------
      if (args.source.kind === "file") {
        const res = await createFileDocument({
          title: args.title,
          srcLang: args.srcLang,
          file: args.source.file,
        });

        // Stale guard
        if (requestIdRef.current !== reqId) return null;

        return res; // { documentId }
      }

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