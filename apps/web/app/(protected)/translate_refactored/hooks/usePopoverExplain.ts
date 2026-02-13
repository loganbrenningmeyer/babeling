import { useCallback, useState } from "react";
import type { Session } from "@/types/session";

import type { DefineEntry } from "@/app/components/DefineCard";
import type { ExplainEntry } from "@/app/components/ExplainCard";
import { fetchDefineAndExplain } from "../api/client";

type UsePopoverExplainArgs = {
  session: Session | null;
  srcLang: string;
  tgtLang: string;
  sourceBlurEnabled: boolean;
  setBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;
};

export function usePopoverExplain({
  session,
  srcLang,
  tgtLang,
  sourceBlurEnabled,
  setBlurredSource,
}: UsePopoverExplainArgs) {
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(null);

  const [targetLocked, setTargetLocked] = useState(false);
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);

  const clearExplain = useCallback(() => {
    setExplainData(null);
    setDefineData(null);
    setExplanationLoading(false);
  }, []);

  const resetInteraction = useCallback(() => {
    setPopoverOpen(false);
    setAnchorEl(null);

    setTargetLocked(false);
    setLockedTargetIndex(null);
    setLockedSourceIndices([]);

    setHoveredTargetIndex(null);
    setHoveredSourceIndex(null);
  }, []);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setPopoverOpen(open);

    if (!open) {
      setTargetLocked(false);
      setLockedTargetIndex(null);
      setLockedSourceIndices([]);
      setHoveredTargetIndex(null);
      setHoveredSourceIndex(null);
    }
  }, []);

  const handleSourceHover = useCallback(
    (idx: number | null) => {
      if (popoverOpen) return;
      setHoveredSourceIndex(idx);
    },
    [popoverOpen]
  );

  const handleTargetHover = useCallback(
    (idx: number | null) => {
      if (popoverOpen) return;
      setHoveredTargetIndex(idx);
    },
    [popoverOpen]
  );

  const handleTargetWordClick = useCallback(
    async (index: number, el: HTMLElement) => {
      if (!session) return;
      if (targetLocked) return;

      setTargetLocked(true);

      const srcIdxs = session.align.tgtToSrc[index] ?? [];
      setLockedTargetIndex(index);
      setLockedSourceIndices(srcIdxs);
      setHoveredTargetIndex(index);

      if (sourceBlurEnabled) {
        setBlurredSource((prev) => {
          const next = new Set(prev);
          for (const idx of srcIdxs) {
            next.delete(idx);
          }
          return next;
        });
      }

      setAnchorEl(el);
      setPopoverOpen(true);
      setExplanationLoading(true);

      try {
        const data = await fetchDefineAndExplain({
          src_lang: srcLang,
          tgt_lang: tgtLang,
          src_words: session.src.words,
          tgt_words: session.tgt.words,
          src_spaces: session.src.spaces,
          tgt_spaces: session.tgt.spaces,
          src_sent_ids: session.src.sentIds,
          tgt_sent_ids: session.tgt.sentIds,
          tgt_par_ids: session.tgt.parIds,
          tgt_to_src: session.align.tgtToSrc,
          tgt_idx: index,
        });

        setExplainData({
          explanation: data.explanation,
          examples: data.examples,
        });

        setDefineData({
          word: data.word,
          sentence: data.sentence,
          paragraph: data.paragraph,
          lemma: data.lemma,
          pos: data.pos,
          ipa_lemma: data.ipa_lemma,
          ipa_form: data.ipa_form,
          gloss: data.gloss,
        });
      } catch (err) {
        console.error(err);
        clearExplain();
      } finally {
        setExplanationLoading(false);
      }
    },
    [clearExplain, session, setBlurredSource, sourceBlurEnabled, srcLang, targetLocked, tgtLang]
  );

  return {
    explanationLoading,
    explainData,
    defineData,
    clearExplain,

    popoverOpen,
    anchorEl,
    handlePopoverOpenChange,

    hoveredSourceIndex,
    hoveredTargetIndex,
    handleSourceHover,
    handleTargetHover,

    targetLocked,
    lockedTargetIndex,
    lockedSourceIndices,
    handleTargetWordClick,

    resetInteraction,
  };
}
