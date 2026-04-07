"use client";

import { useCallback, useRef, useState } from "react";

import type { ReaderSession } from "../types/readerSession";
import type {
  DefineEntry,
  ExplainEntry,
} from "@/app/(protected)/documents/feature/components/Annotate/AnnotateCard";
import type { GlossaryItemSaveRequest } from "../types/glossaryItem";

import { annotate } from "../api/annotate";
import { saveGlossaryItem, loadGlossaryItems, deleteGlossaryItem } from "../api/glossaryItems";
import { makeAnnotateArgs, toAnnotateEntries } from "../types/annotate";
import {
  buildGlossaryItemSaveRequest,
  makeAnnotationKey,
} from "../lib/practiceItemBuilders";

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
  isSwapped: boolean;

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
  isSwapped,
  srcLang,
  tgtLang,
  uiLang,
  sourceBlurEnabled,
  setBlurredSource,
}: UseAnnotatePopoverArgs): AnnotatePopoverController {
  const logicalSrcLang = isSwapped ? tgtLang : srcLang;
  const logicalTgtLang = isSwapped ? srcLang : tgtLang;

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

  // Persisted glossary bookmark keys
  const savedGlossaryKeysRef = useRef<Set<string>>(new Set());
  const savedGlossaryKeysLoadedRef = useRef(false);
  const savedGlossaryKeysLoadingRef = useRef<Promise<void> | null>(null);

  // Stale request guard
  const annotateReqIdRef = useRef(0);

  const targetDisabled = popoverOpen;

  const logicalTargetToSource = isSwapped
    ? session?.alignment.align.srcToTgt
    : session?.alignment.align.tgtToSrc;

  /**************************
   * `ensureSavedGlossaryKeysLoaded()`
   * -- Load persisted glossary items once and index them by annotation key
   **************************/
  const ensureSavedGlossaryKeysLoaded = useCallback(async () => {
    if (savedGlossaryKeysLoadedRef.current) return;
    if (savedGlossaryKeysLoadingRef.current) {
      await savedGlossaryKeysLoadingRef.current;
      return;
    }

    savedGlossaryKeysLoadingRef.current = (async () => {
      const data = await loadGlossaryItems();
      
      const nextKeys = new Set<string>();
      const nextIndex = new Map<string, number>();
      
      for (const item of data.glossaryItems) {
        const key = makeAnnotationKey({
          documentId: item.definition.documentId,
          pageId: item.definition.pageId,
          tgtLang: item.tgtLang,
          wordId: item.definition.wordId,
        });
        
        nextKeys.add(key);
        nextIndex.set(key, item.glossaryItemId);
      }
      
      savedGlossaryKeysRef.current = nextKeys;
      savedGlossaryIndexRef.current = nextIndex;
      savedGlossaryKeysLoadedRef.current = true;
    })().finally(() => {
      savedGlossaryKeysLoadingRef.current = null;
    });

    await savedGlossaryKeysLoadingRef.current;
  }, []);


  /**************************
   * `updateAnnotationCacheBookmark()`
   * -- 
   **************************/
  const updateAnnotationCacheBookmark = useCallback(
    (next: { isBookmarked: boolean; glossaryItemId: number | null }) => {
      if (documentId == null || pageId == null || lockedTargetIndex == null) return;

      const key = makeAnnotationKey({
        documentId,
        pageId,
        tgtLang: logicalTgtLang,
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
    [documentId, pageId, lockedTargetIndex, logicalTgtLang]
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
   * `buildCurrentGlossaryItemSaveRequest()`
   * -- Helper to construct glossary item save request data for the current annotation
   **************************/
  const buildCurrentGlossaryItemSaveRequest = useCallback(
    (): GlossaryItemSaveRequest | null =>
      buildGlossaryItemSaveRequest({
        session,
        defineData,
        explainData,
        documentId,
        pageId,
        lockedTargetIndex,
        logicalSrcLang,
        logicalTgtLang,
        isSwapped,
      }),
    [
      session,
      defineData,
      explainData,
      documentId,
      pageId,
      lockedTargetIndex,
      logicalSrcLang,
      logicalTgtLang,
      isSwapped,
    ]
  );

  /**************************
   * `syncBookmarkIntent()`
   * -- 
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
          const payload = buildCurrentGlossaryItemSaveRequest();
          if (!payload) throw new Error("Missing glossary save data");

          // Store annotation in cache
            const key = makeAnnotationKey({
              documentId,
              pageId,
              tgtLang: logicalTgtLang,
              wordId: lockedTargetIndex!,
            });

          const res = await saveGlossaryItem(payload);
          setSavedGlossary(res.glossaryItemId);

          // -------------------------
          // Persisted bookmark index
          // -- for future clicks/reloads in this hook instance
          // -------------------------
          savedGlossaryKeysRef.current.add(key);
          savedGlossaryIndexRef.current.set(key, res.glossaryItemId);

          // Add cached bookmark
          updateAnnotationCacheBookmark({
            isBookmarked: true,
            glossaryItemId: res.glossaryItemId,
          });

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

          if (documentId != null && pageId != null && lockedTargetIndex != null) {
              const key = makeAnnotationKey({
                documentId,
                pageId,
                tgtLang: logicalTgtLang,
                wordId: lockedTargetIndex,
              });

            savedGlossaryKeysRef.current.delete(key);
            savedGlossaryIndexRef.current.delete(key);
          }

          // Remove cached bookmark
          updateAnnotationCacheBookmark({
            isBookmarked: false,
            glossaryItemId: null,
          });
        }
      } catch (e: unknown) {
        setBookmarkError(e instanceof Error ? e.message : "Failed to sync bookmark");
        setIsBookmarked(!currentDesired);
        break;
      }

      const nextIntent = pendingBookmarkIntentRef.current;
      currentDesired =
        nextIntent == null || nextIntent === currentDesired ? null : nextIntent;
    }

    bookmarkSyncingRef.current = false;
    setBookmarkSyncing(false);
  }, [buildCurrentGlossaryItemSaveRequest, setSavedGlossary]);

  /**************************
   * `onToggleBookmark()`
   * -- Save / unsave glossary item to database
   **************************/
  const onToggleBookmark = useCallback(() => {
    const next = !isBookmarked;

    // Don't toggle before annotation data exists
    if (next && !buildCurrentGlossaryItemSaveRequest()) {
      return;
    }

    // Instant UI update
    setIsBookmarked(next);
    // Background sync
    void syncBookmarkIntent(next);
  }, [isBookmarked, buildCurrentGlossaryItemSaveRequest, syncBookmarkIntent]);

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

      const srcIdxs = logicalTargetToSource?.[tgtIdx] ?? [];

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
        tgtLang: logicalTgtLang,
        wordId: tgtIdx,
      });

      // -------------------------
      // Hydrate bookmarks from DB
      // -------------------------
      try {
        await ensureSavedGlossaryKeysLoaded();
      } catch (e) {
        console.error(e);
      }

      if (annotateReqIdRef.current !== reqId) return;

      const persistedBookmarked = savedGlossaryKeysRef.current.has(key);
      const persistedGlossaryId = savedGlossaryIndexRef.current.get(key) ?? null;

      /// Hydrate bookmark state immediately while annotation loads
      setIsBookmarked(persistedBookmarked);
      setSavedGlossary(persistedGlossaryId);

      const cached = annotationCacheRef.current.get(key);
      if (cached) {
        setDefineData(cached.defineData);
        setExplainData(cached.explainData);

        // Prefer persisted state (DB-backed) over stale cached false
        setIsBookmarked(cached.isBookmarked || persistedBookmarked);
        setSavedGlossary(cached.glossaryItemId ?? persistedGlossaryId);

        setExplanationLoading(false);
        return;
      }

      // -------------------------
      // 2) Make annotate request
      // -------------------------
      try {
        const res = await annotate(
          makeAnnotateArgs({ session, srcLang, tgtLang, uiLang, tgtIdx, isSwapped })
        );

        if (annotateReqIdRef.current !== reqId) return;

        const { explainData, defineData } = toAnnotateEntries(res);
        
        // Cache annotation
        annotationCacheRef.current.set(key, {
          defineData,
          explainData,
          isBookmarked: persistedBookmarked,
          glossaryItemId: persistedGlossaryId,
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
      isSwapped,
      logicalTargetToSource,
      logicalTgtLang,
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
