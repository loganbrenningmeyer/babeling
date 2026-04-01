"use client";

import { cache, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { LoadedDocument } from "../types/document";
import type { ReaderSession } from "../types/readerSession";

import { makeReaderSession, makeEmptyReaderSession } from "../lib/session";
import { getPageTranslation, savePageTranslation } from "../api/pageTranslations";
import { translate } from "../api/translate";
import { align } from "../api/align";

// -------------------------
// Page session determined by document (w/ its srcLang), pageIndex, and tgtLang
// -------------------------
type UsePageSessionArgs = {
  document: LoadedDocument | null;
  pageIndex: number;
  tgtLang: string;
};

type UiUpdate = 
  | ReaderSession["ui"]
  | ((prev: ReaderSession["ui"]) => ReaderSession["ui"]);

/**************************
 * `usePageSession()`
 * -- Orchestrates constructing/updating ReaderSession given a loaded document/page/tgtLang
 **************************/
export function usePageSession({ document, pageIndex, tgtLang }: UsePageSessionArgs) {
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const srcLang = document?.srcLang ?? null;
  const page = document?.pages?.[pageIndex] ?? null;
  const documentPageId = page?.id ?? null;
  const pageText = page?.srcText ?? "";

  // -------------------------
  // Cache ReaderSession by document page ID + srcLang + tgtLang
  // -------------------------
  const cacheRef = useRef<Map<string, ReaderSession>>(new Map());
  const requestIdRef = useRef(0);

  const cacheKey = useMemo(() => {
    if (!documentPageId || !srcLang || !tgtLang) return null;
    return `${documentPageId}|${srcLang}|${tgtLang}`;
  }, [documentPageId, srcLang, tgtLang])

  /**************************
   * `load()`
   * -- Build ReaderSession if cached, otherwise try to load saved translation 
   *    or create a new session after translating + aligning + saving
   **************************/
  const load = useCallback(async () => {
    if (!document || !documentPageId || !srcLang || !tgtLang) {
      setSession(null);
      setLoading(false);
      setError(null);
      return;
    }

    // -------------------------
    // Avoid translating image-only pages
    // -------------------------
    if (!pageText.trim()) {
      const sess = makeEmptyReaderSession();

      if (cacheKey) cacheRef.current.set(cacheKey, sess);
      setSession(sess);
      setLoading(false);
      setError(null);
      return;
    }

    // -------------------------
    // 1) Cache hit
    // -------------------------
    if (cacheKey) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setSession(cached);
        setLoading(false);
        setError(null);
        return;
      }
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // -------------------------
      // 2) Try saved translation
      // -------------------------
      const saved = await getPageTranslation({
        documentPageId,
        srcLang,
        tgtLang,
      });

      if (requestIdRef.current !== reqId) return;

      if (saved) {
        const sess = makeReaderSession({
          srcText: pageText,
          tgtText: saved.translatedText,
          alignment: saved.alignmentData,
        });
      
        if (cacheKey) cacheRef.current.set(cacheKey, sess);
        setSession(sess);
        return;
      }

      // -------------------------
      // 3) Otherwise, translate + align + save page translation
      // -------------------------
      // ---- Translate ----
      const translation = await translate({
        sourceText: pageText,
        srcLang,
        tgtLang,
      });

      if (requestIdRef.current !== reqId) return;

      // ---- Align ----
      const alignment = await align({
        paragraphs: translation.paragraphs,
        srcLang,
        tgtLang,
      });

      // ---- Save Page Translation ----
      await savePageTranslation({
        documentPageId,
        srcLang,
        tgtLang,
        translatedText: translation.targetText,
        alignmentData: alignment,
      })

      if (requestIdRef.current !== reqId) return;

      // -------------------------
      // Build page session from new translation + alignment data
      // -------------------------
      const sess = makeReaderSession({
        srcText: translation.sourceText,
        tgtText: translation.targetText,
        alignment,
      });

      if (cacheKey) cacheRef.current.set(cacheKey, sess);
      setSession(sess);

    } catch (e: any) {
      if (requestIdRef.current !== reqId) return;
      setSession(null);
      setError(e?.message ?? "Failed to load page session");

    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [
    document,
    documentPageId,
    srcLang,
    tgtLang,
    pageText,
    cacheKey,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  // -------------------------
  // Update cached UI state to recover page UI (cache blurred source / navigation)
  //    functional updater, takes prevUi -> nextUi
  // -------------------------
  const updateCachedUi = useCallback(
    (nextUiOrUpdater: UiUpdate) => {
      if (!cacheKey) return;

      const current = cacheRef.current.get(cacheKey) ?? session;
      if (!current) return;

      const nextUi = 
        typeof nextUiOrUpdater === "function"
          ? (nextUiOrUpdater as (prev: ReaderSession["ui"]) => ReaderSession["ui"])(current.ui)
          : nextUiOrUpdater;

      const updated: ReaderSession = { ...current, ui: nextUi };
      cacheRef.current.set(cacheKey, updated);
      setSession(updated);
    },
    [session, cacheKey]
  );

  return {
    session,
    loading,
    error,
    reload: load,
    updateCachedUi,
  };
}
