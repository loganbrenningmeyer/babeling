import { useCallback } from "react";
import type { ReaderSession } from "../types/readerSession";

/**************************
 * `useSourceRevealNav()`
 * -- Enables source blur/unblur using arrow keys 
 *    (left/right: sentence), (up/down: paragraph)
 * 
 * @param 
 * @returns 
 **************************/
export function useSourceRevealNav(args: {
  session: ReaderSession | null;
  isSwapped: boolean;
  sourceBlurEnabled: boolean;
  blurredSource: Set<number>;
  setBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;
  navSentId: number;
  setNavSentId: (v: number) => void;
  navParId: number;
  setNavParId: (v: number) => void;
}) {
  const {
    session,
    isSwapped,
    sourceBlurEnabled,
    blurredSource,
    setBlurredSource,
    setNavSentId,
    setNavParId,
  } = args;

  const sourceBlock = isSwapped ? session?.alignment.tgt : session?.alignment.src;

  const revealWordIndices = useCallback((idxs: number[]) => {
    if (!sourceBlurEnabled) return;
    setBlurredSource((prev) => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.delete(i);
      return next;
    });
  }, [setBlurredSource, sourceBlurEnabled]);

  const hideWordIndices = useCallback((idxs: number[]) => {
    if (!sourceBlurEnabled) return;
    setBlurredSource((prev) => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.add(i);
      return next;
    });
  }, [setBlurredSource, sourceBlurEnabled]);

  const getMaxSentId = useCallback(() => {
    if (!sourceBlock) return 0;
    return Math.max(...sourceBlock.sentIds);
  }, [sourceBlock]);

  const getMaxParId = useCallback(() => {
    if (!sourceBlock) return 0;
    return Math.max(...sourceBlock.parIds);
  }, [sourceBlock]);

  const revealSentence = useCallback((sentId: number) => {
    if (!sourceBlock) return;
    revealWordIndices(sourceBlock.sentToWordIds[sentId] ?? []);
  }, [sourceBlock, revealWordIndices]);

  const hideSentence = useCallback((sentId: number) => {
    if (!sourceBlock) return;
    hideWordIndices(sourceBlock.sentToWordIds[sentId] ?? []);
  }, [sourceBlock, hideWordIndices]);

  const revealParagraph = useCallback((parId: number) => {
    if (!sourceBlock) return;
    revealWordIndices(sourceBlock.parToWordIds[parId] ?? []);
  }, [sourceBlock, revealWordIndices]);

  const hideParagraph = useCallback((parId: number) => {
    if (!sourceBlock) return;
    hideWordIndices(sourceBlock.parToWordIds[parId] ?? []);
  }, [sourceBlock, hideWordIndices]);

  const isSentenceFullyRevealed = useCallback((sentId: number) => {
    if (!sourceBlock) return true;
    const idxs = sourceBlock.sentToWordIds[sentId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }, [sourceBlock, blurredSource]);

  const isParagraphFullyRevealed = useCallback((parId: number) => {
    if (!sourceBlock) return true;
    const idxs = sourceBlock.parToWordIds[parId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }, [sourceBlock, blurredSource]);

  const isParagraphPartiallyOrFullyRevealed = useCallback((parId: number) => {
    if (!sourceBlock) return false;
    const idxs = sourceBlock.parToWordIds[parId] ?? [];
    return idxs.some((i) => !blurredSource.has(i));
  }, [sourceBlock, blurredSource]);

  const getLastSentInPar = useCallback((parId: number) => {
    if (!sourceBlock) return 0;
    const sents = sourceBlock.parToSentIds[parId] ?? [];
    return sents.length ? sents[sents.length - 1] : 0;
  }, [sourceBlock]);

  const findFirstHiddenSentence = useCallback(() => {
    for (let s = 0; s <= getMaxSentId(); s++) {
      if (!isSentenceFullyRevealed(s)) return s;
    }
    return null;
  }, [getMaxSentId, isSentenceFullyRevealed]);

  const findLastRevealedSentenceBefore = useCallback((start: number) => {
    for (let s = Math.min(start, getMaxSentId()); s >= 0; s--) {
      if (isSentenceFullyRevealed(s)) return s;
    }
    return null;
  }, [getMaxSentId, isSentenceFullyRevealed]);

  const findLastRevealedSentence = useCallback(() => {
    return findLastRevealedSentenceBefore(getMaxSentId());
  }, [findLastRevealedSentenceBefore, getMaxSentId]);

  const findFirstHiddenParagraph = useCallback(() => {
    for (let p = 0; p <= getMaxParId(); p++) {
      if (!isParagraphFullyRevealed(p)) return p;
    }
    return null;
  }, [getMaxParId, isParagraphFullyRevealed]);

  const findLastRevealedParagraphBefore = useCallback((start: number) => {
    for (let p = Math.min(start, getMaxParId()); p >= 0; p--) {
      if (isParagraphPartiallyOrFullyRevealed(p)) return p;
    }
    return null;
  }, [getMaxParId, isParagraphPartiallyOrFullyRevealed]);

  const findLastRevealedParagraph = useCallback(() => {
    return findLastRevealedParagraphBefore(getMaxParId());
  }, [findLastRevealedParagraphBefore, getMaxParId]);

  const prev = useCallback((mode: "sentence" | "paragraph") => {
    if (!sourceBlock) return;
    if (!sourceBlurEnabled) return;

    if (mode === "sentence") {
      const last = findLastRevealedSentence();
      if (last === null) return;

      const prevShown = findLastRevealedSentenceBefore(last - 1);
      hideSentence(last);

      if (prevShown === null) {
        setNavSentId(-1);
        setNavParId(-1);
        return;
      }

      setNavSentId(prevShown);
      setNavParId(sourceBlock.sentToParIds[prevShown]);
      return;
    }

    const lastPar = findLastRevealedParagraph();
    if (lastPar === null) return;

    const prevPar = findLastRevealedParagraphBefore(lastPar - 1);
    hideParagraph(lastPar);

    if (prevPar === null) {
      setNavParId(-1);
      setNavSentId(-1);
      return;
    }

    setNavParId(prevPar);
    setNavSentId(getLastSentInPar(prevPar));
  }, [
    sourceBlock,
    sourceBlurEnabled,
    findLastRevealedSentence,
    findLastRevealedSentenceBefore,
    hideSentence,
    setNavSentId,
    setNavParId,
    findLastRevealedParagraph,
    findLastRevealedParagraphBefore,
    hideParagraph,
    getLastSentInPar,
  ]);

  const next = useCallback((mode: "sentence" | "paragraph") => {
    if (!sourceBlock) return;
    if (!sourceBlurEnabled) return;

    if (mode === "sentence") {
      const firstHidden = findFirstHiddenSentence();
      if (firstHidden === null) return;

      setNavParId(sourceBlock.sentToParIds[firstHidden]);
      setNavSentId(firstHidden);
      revealSentence(firstHidden);
      return;
    }

    const firstHiddenPar = findFirstHiddenParagraph();
    if (firstHiddenPar === null) return;

    revealParagraph(firstHiddenPar);
    setNavParId(firstHiddenPar);
    setNavSentId(getLastSentInPar(firstHiddenPar));
  }, [
    sourceBlock,
    sourceBlurEnabled,
    findFirstHiddenSentence,
    revealSentence,
    setNavParId,
    setNavSentId,
    findFirstHiddenParagraph,
    revealParagraph,
    getLastSentInPar,
  ]);

  return { prev, next };
}
