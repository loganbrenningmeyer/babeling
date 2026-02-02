import * as React from "react";
import type { Session } from "@/app/translate/page";

export function useSourceRevealNav(args: {
  session: Session | null;
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
    sourceBlurEnabled,
    blurredSource,
    setBlurredSource,
    setNavSentId,
    setNavParId,
  } = args;

  const revealWordIndices = React.useCallback((idxs: number[]) => {
    if (!sourceBlurEnabled) return;
    setBlurredSource((prev) => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.delete(i);
      return next;
    });
  }, [setBlurredSource, sourceBlurEnabled]);

  const hideWordIndices = React.useCallback((idxs: number[]) => {
    if (!sourceBlurEnabled) return;
    setBlurredSource((prev) => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.add(i);
      return next;
    });
  }, [setBlurredSource, sourceBlurEnabled]);

  const getMaxSentId = React.useCallback(() => {
    if (!session) return 0;
    return Math.max(...session.src.sentIds);
  }, [session]);

  const getMaxParId = React.useCallback(() => {
    if (!session) return 0;
    return Math.max(...session.src.parIds);
  }, [session]);

  const revealSentence = React.useCallback((sentId: number) => {
    if (!session) return;
    revealWordIndices(session.src.sentToWordIds[sentId] ?? []);
  }, [session, revealWordIndices]);

  const hideSentence = React.useCallback((sentId: number) => {
    if (!session) return;
    hideWordIndices(session.src.sentToWordIds[sentId] ?? []);
  }, [session, hideWordIndices]);

  const revealParagraph = React.useCallback((parId: number) => {
    if (!session) return;
    revealWordIndices(session.src.parToWordIds[parId] ?? []);
  }, [session, revealWordIndices]);

  const hideParagraph = React.useCallback((parId: number) => {
    if (!session) return;
    hideWordIndices(session.src.parToWordIds[parId] ?? []);
  }, [session, hideWordIndices]);

  const isSentenceFullyRevealed = React.useCallback((sentId: number) => {
    if (!session) return true;
    const idxs = session.src.sentToWordIds[sentId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }, [session, blurredSource]);

  const isParagraphFullyRevealed = React.useCallback((parId: number) => {
    if (!session) return true;
    const idxs = session.src.parToWordIds[parId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }, [session, blurredSource]);

  const getLastSentInPar = React.useCallback((parId: number) => {
    if (!session) return 0;
    const sents = session.src.parToSentIds[parId] ?? [];
    return sents.length ? sents[sents.length - 1] : 0;
  }, [session]);

  const findFirstHiddenSentence = React.useCallback(() => {
    for (let s = 0; s <= getMaxSentId(); s++) {
      if (!isSentenceFullyRevealed(s)) return s;
    }
    return null;
  }, [getMaxSentId, isSentenceFullyRevealed]);

  const findLastRevealedSentenceBefore = React.useCallback((start: number) => {
    for (let s = Math.min(start, getMaxSentId()); s >= 0; s--) {
      if (isSentenceFullyRevealed(s)) return s;
    }
    return null;
  }, [getMaxSentId, isSentenceFullyRevealed]);

  const findLastRevealedSentence = React.useCallback(() => {
    return findLastRevealedSentenceBefore(getMaxSentId());
  }, [findLastRevealedSentenceBefore, getMaxSentId]);

  const findFirstHiddenParagraph = React.useCallback(() => {
    for (let p = 0; p <= getMaxParId(); p++) {
      if (!isParagraphFullyRevealed(p)) return p;
    }
    return null;
  }, [getMaxParId, isParagraphFullyRevealed]);

  const findLastRevealedParagraphBefore = React.useCallback((start: number) => {
    for (let p = Math.min(start, getMaxParId()); p >= 0; p--) {
      if (isParagraphFullyRevealed(p)) return p;
    }
    return null;
  }, [getMaxParId, isParagraphFullyRevealed]);

  const findLastRevealedParagraph = React.useCallback(() => {
    return findLastRevealedParagraphBefore(getMaxParId());
  }, [findLastRevealedParagraphBefore, getMaxParId]);

  const prev = React.useCallback((mode: "sentence" | "paragraph") => {
    if (!session) return;
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
      setNavParId(session.src.sentToParIds[prevShown]);
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
    session,
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

  const next = React.useCallback((mode: "sentence" | "paragraph") => {
    if (!session) return;
    if (!sourceBlurEnabled) return;

    if (mode === "sentence") {
      const firstHidden = findFirstHiddenSentence();
      if (firstHidden === null) return;

      setNavParId(session.src.sentToParIds[firstHidden]);
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
    session,
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
