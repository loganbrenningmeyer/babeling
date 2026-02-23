"use client";

import { useCallback, useRef, useState } from "react";

import type { ReaderSession } from "../types/readerSession";
import type {
  DefineEntry,
  ExplainEntry,
} from "@/app/(protected)/documents/feature/components/Annotate/AnnotateCard";

import { annotate } from "../api/annotate";
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


export function useAnnotatePopover({
  session,
  srcLang,
  tgtLang,
  uiLang,
  sourceBlurEnabled,
  setBlurredSource,
}: UseAnnotatePopoverArgs): AnnotatePopoverController {
  // Popover state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // Word-selection locking
  const [targetLocked, setTargetLocked] = useState(false);
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);

  // Annotation data
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);

  // Glossary item bookmark
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Stale request guard
  const annotateReqIdRef = useRef(0);

  const targetDisabled = popoverOpen;

  const reset = useCallback(() => {
    setTargetLocked(false);
    setLockedTargetIndex(null);
    setLockedSourceIndices([]);
    setAnchorEl(null);

    setExplainData(null);
    setDefineData(null);
    setIsBookmarked(false);

    annotateReqIdRef.current++;
    setExplanationLoading(false);
  }, []);

  const onPopoverOpenChange = useCallback(
    (open: boolean) => {
      setPopoverOpen(open);
      if (!open) reset();
    },
    [reset]
  );

  const onToggleBookmark = useCallback(() => {
    setIsBookmarked((p) => !p);
  }, []);

  const onTargetWordClick = useCallback(
    async (tgtIdx: number, el: HTMLElement) => {
      if (!session) return;
      if (targetLocked) return;

      setTargetLocked(true);
      setIsBookmarked(false);

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

      try {
        const res = await annotate(
          makeAnnotateArgs({ session, srcLang, tgtLang, uiLang, tgtIdx })
        );

        if (annotateReqIdRef.current !== reqId) return;

        const { explainData, defineData } = toAnnotateEntries(res);
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