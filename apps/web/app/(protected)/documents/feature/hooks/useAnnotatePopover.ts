"use client";

import { useCallback, useRef, useState } from "react";

import type { ReaderSession } from "../types/readerSession";
import type {
  DefineEntry,
  ExplainEntry,
} from "@/app/(protected)/documents/feature/components/Annotate/AnnotateCard";

import { annotate } from "../api/annotate";
import { saveGlossaryItem, loadGlossaryItem, deleteGlossaryItem } from "../api/glossaryItems";
import { GlossarySaveRequest } from "../types/glossaryItem";
import { makeAnnotateArgs, toAnnotateEntries } from "../types/annotate";

export type AnnotatePopoverController = {
  // Popover
  popoverOpen: boolean;
  anchorEl: HTMLElement | null;
  onPopoverOpenChange: (open: boolean) => void;

  // Word-selection / highlight locking
  lockedTargetIndex: number | null;
  lockedSourceIndices: number[];

  // annotation data
  explanationLoading: boolean;
  explainData: ExplainEntry | null;
  defineData: DefineEntry | null;

  // bookmarking (local for now)
  isBookmarked: boolean;
  onToggleBookmark: () => void;

  // interaction
  targetDisabled: boolean;
  onTargetWordClick: (tgtIdx: number, el: HTMLElement) => void;
};

type UseAnnotatePopoverArgs = {
  session: ReaderSession | null;
  documentId: number | null;
  pageId: number | null;

  // annotate() API data
  srcLang: string;
  tgtLang: string;
  uiLang: string;

  // Blur effects
  sourceBlurEnabled: boolean;
  setBlurredSource: (
    updater: Set<number> | ((prev: Set<number>) => Set<number>)
  ) => void;
};

// -------------------------
// Annotation Session Cache
// -------------------------
type CachedAnnotation = {
  defineData: DefineEntry;
  explainData: ExplainEntry;
  isBookmarked: boolean;
  glossaryItemId: number | null;
}


export function useAnnotatePopover({
  session,
  documentId,
  pageId,
  srcLang,
  tgtLang,
  uiLang,
  sourceBlurEnabled,
  setBlurredSource,
}: UseAnnotatePopoverArgs): AnnotatePopoverController {
  // -------------------------
  // Annotation Popover State
  // -------------------------
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // -------------------------
  // Word-selection Locking
  // -------------------------
  const [targetLocked, setTargetLocked] = useState(false);
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);

  // -------------------------
  // Annotation Data
  // -------------------------
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);
  const annotationCacheRef = useRef<Map<string, CachedAnnotation>>(new Map());

  // -------------------------
  // Glossary Items
  // -------------------------
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkError, setBookmarkError] = useState<string | null>(null);
  // Bookmark syncing for fast UI
  const [bookmarkSyncing, setBookmarkSyncing] = useState(false);
  const pendingBookmarkIntentRef = useRef<boolean | null>(null);
  const bookmarkSyncingRef = useRef(false);
  // Saved glossary item
  const [savedGlossaryId, setSavedGlossaryId] = useState<number | null>(null);
  const savedGlossaryIdRef = useRef<number | null>(null);   // DB glossary_item_id for current saved item
  const savedGlossaryIndexRef = useRef<Map<string, number>>(new Map());   // Maps annotation cache key -> DB glossary_item_id

  // Stale request guard
  const annotateReqIdRef = useRef(0);

  const targetDisabled = popoverOpen;

  /**************************
   * `makeAnnotationKey()`
   * -- Creates annotation cache key for the session, allowing recovering annotations
   *    without having to save them
   **************************/
  function makeAnnotationKey(args: {
    documentId: number | null;
    pageId: number | null;
    tgtLang: string;
    wordId: number;
  }) {
    const { documentId, pageId, tgtLang, wordId } = args;
    return `${documentId ?? "x"}|${pageId ?? "x"}|${tgtLang}|${wordId}`;
  }

  /**************************
   * `updateAnnotationCacheBookmark()`
   * -- 
   * 
   * @param 
   * @returns 
   **************************/
  const updateAnnotationCacheBookmark = useCallback(
    (next: { isBookmarked: boolean; glossaryItemId: number | null }) => {
      if (documentId == null || pageId == null || lockedTargetIndex == null) return;

      const key = makeAnnotationKey({
        documentId,
        pageId,
        tgtLang,
        wordId: lockedTargetIndex,
      });

      const cached = annotationCacheRef.current.get(key);
      if (!cached) return;

      annotationCacheRef.current.set(key, {
        ...cached,
        isBookmarked: next.isBookmarked,
        glossaryItemId: next.glossaryItemId,
      });

      if (next.glossaryItemId != null) {
        savedGlossaryIndexRef.current.set(key, next.glossaryItemId);
      } else {
        savedGlossaryIndexRef.current.delete(key);
      }
    },
    [documentId, pageId, lockedTargetIndex, tgtLang]
  );

  /**************************
   * `setSavedGlossary()`
   * -- Keep saved glossary item / ref in sync
   **************************/
  const setSavedGlossary = useCallback((id: number | null) => {
    savedGlossaryIdRef.current = id;
    setSavedGlossaryId(id);
  }, []);

  const reset = useCallback(() => {
    setTargetLocked(false);
    setLockedTargetIndex(null);
    setLockedSourceIndices([]);
    setAnchorEl(null);
    // Annotation Data
    setExplainData(null);
    setDefineData(null);
    // Bookmarked Glossary Item State
    setIsBookmarked(false);
    setSavedGlossary(null);
    setBookmarkSyncing(false);
    setBookmarkError(null);
    pendingBookmarkIntentRef.current = null;
    bookmarkSyncingRef.current = false;

    annotateReqIdRef.current++;
    setExplanationLoading(false);
  }, []);

  /**************************
   * `onPopoverOpenChange()`
   * -- 
   * 
   * @param 
   * @returns 
   **************************/
  const onPopoverOpenChange = useCallback(
    (open: boolean) => {
      setPopoverOpen(open);
      if (!open) reset();
    },
    [reset]
  );

  /**************************
   * `buildGlossarySaveRequest()`
   * -- Helper to construct glossary item save request data
   **************************/
  const buildGlossarySaveRequest = useCallback((): GlossarySaveRequest | null => {
    if (!session) return null;
    if (!defineData || !explainData) return null;
    if (documentId == null || pageId == null) return null;
    if (lockedTargetIndex == null) return null;

    const sentId = session.alignment.tgt.sentIds[lockedTargetIndex];
    const parId = session.alignment.tgt.parIds[lockedTargetIndex];
    if (sentId == null || parId == null) return null;

    return {
      srcLang,
      tgtLang,
      definition: {
        form: defineData.form,
        posForm: defineData.posForm || null,
        ipaForm: defineData.ipaForm || null,
        lemma: defineData.lemma || null,
        posLemma: defineData.posLemma || null,
        ipaLemma: defineData.ipaLemma || null,
        gloss: defineData.gloss,
        srcSentence: defineData.srcSentence,
        srcParagraph: defineData.srcParagraph,
        tgtSentence: defineData.tgtSentence,
        tgtParagraph: defineData.tgtParagraph,
        documentId,
        pageId,
        parId,
        sentId,
        wordId: lockedTargetIndex,
      },
      usage: {
        explanation: explainData.explanation,
        examples: explainData.examples,
      },
    };
  }, [
    session,
    defineData,
    explainData,
    documentId,
    pageId,
    lockedTargetIndex,
    srcLang,
    tgtLang,
  ]);

  /**************************
   * `syncBookmarkIntent()`
   * -- 
   * 
   * @param 
   * @returns 
   **************************/
  const syncBookmarkIntent = useCallback(async (desired: boolean) => {
    if (bookmarkSyncingRef.current) {
      pendingBookmarkIntentRef.current = desired;
      return;
    }

    bookmarkSyncingRef.current = true;
    setBookmarkSyncing(true);
    setBookmarkError(null);

    let currentDesired: boolean | null = desired;

    while (currentDesired != null) {
      pendingBookmarkIntentRef.current = null;

      // -------------------------
      // Save glossary item
      // -------------------------
      try {
        if (currentDesired) {
          const payload = buildGlossarySaveRequest();
          if (!payload) throw new Error("Missing glossary save data");

          // Store annotation in cache
          const key = makeAnnotationKey({
            documentId,
            pageId,
            tgtLang,
            wordId: lockedTargetIndex!,
          });

          const res = await saveGlossaryItem(payload);
          setSavedGlossary(res.glossaryItemId);

          // Add cached bookmark
          updateAnnotationCacheBookmark({
            isBookmarked: true,
            glossaryItemId: res.glossaryItemId,
          });

          // Saved index cache (word -> glossary_item_id)
          savedGlossaryIndexRef.current.set(key, res.glossaryItemId);

          // Annotation cache (if current annotation is loaded)
          if (defineData && explainData) {
            annotationCacheRef.current.set(key, {
              defineData,
              explainData,
              isBookmarked: true,
              glossaryItemId: res.glossaryItemId,
            });
          }
        // -------------------------
        // Delete glossary item
        // -------------------------
        } else {
          // -------------------------
          // If we don't have an ID, clear local state
          // -- e.g., if user toggles off before save finishes
          // -------------------------
          const id = savedGlossaryIdRef.current;
          
          if (id != null) {
            await deleteGlossaryItem(id);
          }
          setSavedGlossary(null);

          // Remove cached bookmark
          updateAnnotationCacheBookmark({
            isBookmarked: false,
            glossaryItemId: null,
          });
        }
      } catch (e: any) {
        setBookmarkError(e?.message ?? "Failed to sync bookmark");
        setIsBookmarked(!currentDesired);
        break;
      }

      const nextIntent = pendingBookmarkIntentRef.current;
      currentDesired =
        nextIntent == null || nextIntent === currentDesired ? null : nextIntent;
    }

    bookmarkSyncingRef.current = false;
    setBookmarkSyncing(false);
  }, [buildGlossarySaveRequest, setSavedGlossary]);

  /**************************
   * `onToggleBookmark()`
   * -- Save / unsave glossary item to database
   **************************/
  const onToggleBookmark = useCallback(() => {
    const next = !isBookmarked;

    // Don't toggle before annotation data exists
    if (next && !buildGlossarySaveRequest()) {
      return;
    }

    // Instant UI update
    setIsBookmarked(next);
    // Background sync
    void syncBookmarkIntent(next);
  }, [isBookmarked, buildGlossarySaveRequest, syncBookmarkIntent]);

  /**************************
   * `onTargetWordClick()`
   * -- Unblur aligned source / get annotation information
   **************************/
  const onTargetWordClick = useCallback(
    async (tgtIdx: number, el: HTMLElement) => {
      if (!session) return;
      if (targetLocked) return;

      setTargetLocked(true);
      setIsBookmarked(false);
      setSavedGlossary(null);

      const srcIdxs = session.alignment.align.tgtToSrc[tgtIdx] ?? [];

      setLockedTargetIndex(tgtIdx);
      setLockedSourceIndices(srcIdxs);

      // Unblur aligned source
      if (sourceBlurEnabled) {
        setBlurredSource((prev) => {
          const next = new Set(prev);
          for (const idx of srcIdxs) next.delete(idx);
          return next;
        });
      }

      setAnchorEl(el);
      setPopoverOpen(true);

      const reqId = ++annotateReqIdRef.current;
      setExplanationLoading(true);

      // -------------------------
      // 1) Check annotation cache
      // -------------------------
      const key = makeAnnotationKey({
        documentId,
        pageId,
        tgtLang,
        wordId: tgtIdx,
      });

      const cached = annotationCacheRef.current.get(key);
      if (cached) {
        setDefineData(cached.defineData);
        setExplainData(cached.explainData);
        setIsBookmarked(cached.isBookmarked);
        setSavedGlossary(cached.glossaryItemId);
        setExplanationLoading(false);
        return;
      }

      // -------------------------
      // 2) Make annotate request
      // -------------------------
      try {
        const res = await annotate(
          makeAnnotateArgs({ session, srcLang, tgtLang, uiLang, tgtIdx })
        );

        if (annotateReqIdRef.current !== reqId) return;

        const { explainData, defineData } = toAnnotateEntries(res);
        
        // Cache annotation
        annotationCacheRef.current.set(key, {
          defineData,
          explainData,
          isBookmarked: false,
          glossaryItemId: null,
        });

        setExplainData(explainData);
        setDefineData(defineData);

      } catch (e) {
        if (annotateReqIdRef.current !== reqId) return;
        console.error(e);
        setExplainData(null);
        setDefineData(null);

      } finally {
        if (annotateReqIdRef.current === reqId) setExplanationLoading(false);
      }
    },
    [
      session,
      targetLocked,
      sourceBlurEnabled,
      setBlurredSource,
      srcLang,
      tgtLang,
      uiLang,
    ]
  );

  return {
    popoverOpen,
    anchorEl,
    onPopoverOpenChange,

    lockedTargetIndex,
    lockedSourceIndices,

    explanationLoading,
    explainData,
    defineData,

    isBookmarked,
    onToggleBookmark,

    targetDisabled,
    onTargetWordClick,
  };
}
