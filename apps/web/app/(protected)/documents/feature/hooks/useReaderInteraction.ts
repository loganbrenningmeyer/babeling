"use client";

import { useCallback, useMemo, useState } from "react";

import type { ReaderSession } from "../types/readerSession";
import type { DefineEntry, ExplainEntry } from "../components/Annotate/AnnotateCard";

import { useAnnotatePopover } from "./useAnnotatePopover";
import { useSourceRevealNav } from "./useSourceRevealNav";

export type ReaderInteraction = {
  // Source / target highlighting
  sourceHighlightIndices: number[];
  targetHighlightIndices: number[];
  onSourceHover: (idx: number | null) => void;
  onTargetHover: (idx: number | null) => void;

  // Annotation Popover
  onTargetWordClick: (i: number, el: HTMLElement) => void;
  targetDisabled: boolean;

  popoverOpen: boolean;
  anchorEl: HTMLElement | null;
  onPopoverOpenChange: (open: boolean) => void;

  explanationLoading: boolean;
  explainData: ExplainEntry | null;
  defineData: DefineEntry | null;

  // Glossary bookmarking
  isBookmarked: boolean;
  onToggleBookmark: () => void;

  // Source reveal navigation
  navSentId: number;
  navParId: number;
  revealPrev: (mode: "sentence" | "paragraph") => void;
  revealNext: (mode: "sentence" | "paragraph") => void;
};

type UseReaderInteractionArgs = {
  session: ReaderSession | null;

  // text IDs
  documentId: number | null;
  pageId: number | null;

  // for /api/annotate
  srcLang: string;
  tgtLang: string;
  uiLang: string;

  // blur behavior
  sourceBlurEnabled: boolean;
  blurredSource: Set<number>;
  setBlurredSource: (
    updater: Set<number> | ((prev: Set<number>) => Set<number>)
  ) => void;

  // UI cache (functional updater)
  updateCachedUi: (
    nextUi:
      | ReaderSession["ui"]
      | ((prev: ReaderSession["ui"]) => ReaderSession["ui"])
  ) => void;
};

export function useReaderInteraction({
  session,
  documentId,
  pageId,
  srcLang,
  tgtLang,
  uiLang,
  sourceBlurEnabled,
  blurredSource,
  setBlurredSource,
  updateCachedUi,
}: UseReaderInteractionArgs): ReaderInteraction {
  // -------------------------
  // Hover state (ignored when popover is open)
  // -------------------------
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(
    null
  );
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(
    null
  );

  // -------------------------
  // Source reveal navigation state
  // -------------------------
  const navSentId = session?.ui.navSentId ?? -1;
  const navParId = session?.ui.navParId ?? -1;

  const setNavSentId = useCallback(
    (v: number) => {
      updateCachedUi((prevUi) => ({ ...prevUi, navSentId: v }));
    },
    [updateCachedUi]
  );

  const setNavParId = useCallback(
    (v: number) => {
      updateCachedUi((prevUi) => ({ ...prevUi, navParId: v }));
    },
    [updateCachedUi]
  );

  // Source reveal navigation hook
  const { prev, next } = useSourceRevealNav({
    session,
    sourceBlurEnabled,
    blurredSource,
    setBlurredSource,
    navSentId,
    setNavSentId,
    navParId,
    setNavParId,
  });

  // -------------------------
  // Annotation Popover hook
  // -------------------------
  const pop = useAnnotatePopover({
    session,
    documentId,
    pageId,
    srcLang,
    tgtLang,
    uiLang,
    sourceBlurEnabled,
    setBlurredSource,
  });

  // -------------------------
  // Derived active indices for highlighting
  // -------------------------
  const activeSourceIndex = pop.popoverOpen ? null : hoveredSourceIndex;
  const activeTargetIndex = pop.popoverOpen
    ? pop.lockedTargetIndex
    : hoveredTargetIndex;

  const activeAlignedSource = useMemo(() => {
    if (!session) return [];
    if (pop.popoverOpen) return pop.lockedSourceIndices;
    if (hoveredTargetIndex == null) return [];
    return session.alignment.align.tgtToSrc[hoveredTargetIndex] ?? [];
  }, [session, pop.popoverOpen, pop.lockedSourceIndices, hoveredTargetIndex]);

  const activeAlignedTarget = useMemo(() => {
    if (!session) return [];
    if (activeSourceIndex == null) return [];
    return session.alignment.align.srcToTgt[activeSourceIndex] ?? [];
  }, [session, activeSourceIndex]);

  const sourceHighlightIndices = useMemo(() => {
    const out: number[] = [];
    if (activeSourceIndex != null) out.push(activeSourceIndex);
    out.push(...activeAlignedSource);
    return out;
  }, [activeSourceIndex, activeAlignedSource]);

  const targetHighlightIndices = useMemo(() => {
    const out: number[] = [];
    if (activeTargetIndex != null) out.push(activeTargetIndex);
    out.push(...activeAlignedTarget);
    return out;
  }, [activeTargetIndex, activeAlignedTarget]);


  /**************************
   * `onSourceHover()` / `onTargetHover()`
   * -- 
   * 
   * @param 
   * @returns 
   **************************/
  const onSourceHover = useCallback(
    (idx: number | null) => {
      if (pop.popoverOpen) return;
      setHoveredSourceIndex(idx);
    },
    [pop.popoverOpen]
  );

  const onTargetHover = useCallback(
    (idx: number | null) => {
      if (pop.popoverOpen) return;
      setHoveredTargetIndex(idx);
    },
    [pop.popoverOpen]
  );

  return {
    // Source / target highlighting
    sourceHighlightIndices,
    targetHighlightIndices,
    onSourceHover,
    onTargetHover,
    
    // Annotation Popover
    onTargetWordClick: pop.onTargetWordClick,
    targetDisabled: pop.targetDisabled,

    popoverOpen: pop.popoverOpen,
    anchorEl: pop.anchorEl,
    onPopoverOpenChange: pop.onPopoverOpenChange,

    explanationLoading: pop.explanationLoading,
    explainData: pop.explainData,
    defineData: pop.defineData,

    // Glossary bookmarking
    isBookmarked: pop.isBookmarked,
    onToggleBookmark: pop.onToggleBookmark,

    // Source reveal navigation
    navSentId,
    navParId,
    revealPrev: prev,
    revealNext: next,
  };
}
