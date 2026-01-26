"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BlurMode, BlurModeToggle } from "../components/BlurModeToggle";
import { DefineEntry, DefineCard } from "../components/DefineCard";
import { ExplainEntry, ExplainCard } from "../components/ExplainCard";
import { Pane } from "../components/Pane";
import { AppTextarea } from "../components/AppTextarea";
import { TextSurface } from "../components/TextSurface";
import { AnchoredPopover } from "../components/AnchoredPopover";
import { ExplainSkeleton } from "../components/ExplainSkeleton";
import { TextSkeleton } from "../components/TextSkeleton";
import { ParagraphGrid } from "../components/ParagraphGrid";


export type Session = {
  sourceText: string;
  targetText: string;

  src: {
    words: string[];
    spaces: string[];
    sentIds: number[];
    sentToParIds: Record<number, number>;
    sentToWordIds: Record<number, number[]>;
    parIds: number[];
    parToSentIds: Record<number, number[]>;
    parToWordIds: Record<number, number[]>;
  };

  tgt: {
    words: string[];
    spaces: string[];
    sentIds: number[];
  };

  align: {
    srcToTgt: Record<number, number[]>;
    tgtToSrc: Record<number, number[]>;
  };
};

export default function Translate() {
  // -------------------------
  // Core state
  // -------------------------
  const [sourceText, setSourceText] = useState("");
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);

  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());

  const [showAligned, setShowAligned] = useState(false);
  
  // Lock target/source when Popover is showing
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);
  const [targetLocked, setTargetLocked] = useState(false);

  // Current sentence/paragraph for arrow navigation
  const [navSentId, setNavSentId] = useState<number>(-1);
  const [navParId, setNavParId] = useState<number>(-1);
  // -------------------------
  // Popover / interaction state
  // -------------------------
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(
    null
  );
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(
    null
  );

  // -------------------------
  // Derived values
  // -------------------------
  const activeSourceIndex = popoverOpen ? null : hoveredSourceIndex;
  const activeTargetIndex = popoverOpen ? lockedTargetIndex : hoveredTargetIndex;

  const activeAlignedSource =
    popoverOpen
      ? lockedSourceIndices
      : hoveredTargetIndex !== null
        ? (session?.align.tgtToSrc[hoveredTargetIndex] ?? [])
        : [];
    
  const activeAlignedTarget =
    activeSourceIndex !== null
      ? (session?.align.srcToTgt[activeSourceIndex] ?? [])
      : [];

  // -------------------------
  // Handlers
  // -------------------------
  async function translate_and_align() {
    if (!sourceText.trim()) return;

    setTranslationLoading(true);

    // Translate
    const translate_res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: sourceText }),
    });
    const translate_data = await translate_res.json();

    // Update normalized source text / get translated target
    const source = translate_data.source;
    const target = translate_data.target;

    // Align
    const align_res = await fetch("/api/align", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        target,
      }),
    });
    const align_data = await align_res.json();

    // Update session
    setSession({
      sourceText: source,
      targetText: target,
      src: {
        words: align_data.src_words,
        spaces: align_data.src_spaces,
        sentIds: align_data.src_sent_ids,
        sentToParIds: align_data.src_sent_to_par_ids,
        sentToWordIds: align_data.src_sent_to_word_ids,
        parIds: align_data.src_par_ids,
        parToSentIds: align_data.src_par_to_sent_ids,
        parToWordIds: align_data.src_par_to_word_ids,
      },
      tgt: {
        words: align_data.tgt_words,
        spaces: align_data.tgt_spaces,
        sentIds: align_data.tgt_sent_ids,
      },
      align: {
        srcToTgt: align_data.src_to_tgt,
        tgtToSrc: align_data.tgt_to_src,
      },
    });

    // Initialize source words to blurred
    setBlurredSource(new Set(align_data.src_words.map((_: any, i: number) => i)));

    setTranslationLoading(false);
    setShowAligned(true);
  }

  function translateAgain() {
    setSourceText("");
    setShowAligned(false);
    setHoveredSourceIndex(null);
    setHoveredTargetIndex(null);
    setSession(null);
    setExplainData(null);
    setDefineData(null);
  }

  async function handleTargetWordClick(i: number, el: HTMLElement) {
    if (!session) return;
    if (targetLocked) return;
    setTargetLocked(true);

    // -------------------------
    // Unblur aligned English words
    // -------------------------
    const srcIdxs = session.align.tgtToSrc[i] ?? [];

    setLockedTargetIndex(i);
    setLockedSourceIndices(srcIdxs);
    setHoveredTargetIndex(i);

    setBlurredSource(prev => {
      const next = new Set(prev);
      for (const idx of srcIdxs) next.delete(idx);
      return next;
    })

    // -------------------------
    // Store target word idx / where it is
    // -------------------------
    setAnchorEl(el);
    setPopoverOpen(true);

    // -------------------------
    // Get explanation / definition
    // -------------------------
    setExplanationLoading(true);

    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src_words: session.src.words,
        tgt_words: session.tgt.words,
        src_spaces: session.src.spaces,
        tgt_spaces: session.tgt.spaces,
        src_sent_ids: session.src.sentIds,
        tgt_sent_ids: session.tgt.sentIds,
        tgt_to_src: session.align.tgtToSrc,
        tgt_idx: i,
      }),
    });
    const data = await res.json();

    setExplainData({
      explanation: data.explanation.explanation,
      examples: data.explanation.examples,
    });
    setDefineData(
      data.definition
        ? {
            word: data.definition.word,
            pos: data.definition.pos,
            definition: data.definition.definition,
            pronunciation: data.definition.pronunciation,
            infinitive: data.definition.infinitive,
          }
        : null
    );

    setExplanationLoading(false);
  }
  
  // -------------------------
  // Hover Highlighting
  // -------------------------
  const handleSourceHover = (idx: number | null) => {
    if (popoverOpen) return;        // lock
    setHoveredSourceIndex(idx);
  };

  const handleTargetHover = (idx: number | null) => {
    if (popoverOpen) return;        // lock
    setHoveredTargetIndex(idx);
  };

  // -------------------------
  // Text blur helper functions
  // -------------------------
  function revealWordIndices(idxs: number[]) {
    setBlurredSource(prev => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.delete(i);
      return next;
    })
  }

  function revealSentence(sentId: number) {
    if (!session) return;
    const idxs = session.src.sentToWordIds[sentId];
    revealWordIndices(idxs);
  }

  function revealParagraph(parId: number) {
    if (!session) return;
    const idxs = session.src.parToWordIds[parId];
    revealWordIndices(idxs);
  }

  function hideWordIndices(idxs: number[]) {
    setBlurredSource(prev => {
      if (idxs.length === 0) return prev;
      const next = new Set(prev);
      for (const i of idxs) next.add(i);
      return next;
    })
  }

  function hideSentence(sentId: number) {
    if (!session) return;
    const idxs = session.src.sentToWordIds[sentId];
    hideWordIndices(idxs);
  }

  function hideParagraph(parId: number) {
    if (!session) return;
    const idxs = session.src.parToWordIds[parId];
    hideWordIndices(idxs);
  }

  function isParagraphFullyRevealed(parId: number) {
    if (!session) return true;
    const idxs = session.src.parToWordIds[parId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }

  function isSentenceFullyRevealed(sentId: number) {
    if (!session) return true;
    const idxs = session.src.sentToWordIds[sentId] ?? [];
    return idxs.every((i) => !blurredSource.has(i));
  }

  function getLastSentInPar(parId: number) {
    if (!session) return 0;
    const sents = session.src.parToSentIds[parId] ?? [];
    return sents.length ? sents[sents.length - 1] : 0;
  }

  function getMaxParId() {
    if (!session) return 0;
    // safer than Object.keys length if ids are 0..N already:
    return Math.max(...session.src.parIds);
  }

  function getMaxSentId() {
    if (!session) return 0;
    return Math.max(...session.src.sentIds);
  }

  function findNextBlurredSentence(start: number): number | null {
    for (let s = Math.max(0, start); s <= getMaxSentId(); s++) {
      if (!isSentenceFullyRevealed(s)) return s;
    }
    return null;
  }

  // -------------------------
  // Text navigation
  // -------------------------
  // Go to previous sentence / paragraph
  const handlePrev = (mode: "sentence" | "paragraph") => {
    if (!session) return;

    // Sentence
    if (mode === "sentence") {
      if (navSentId === -1) return;
      if (navSentId === 0) {
        hideSentence(navSentId);
        setNavSentId(-1);
        setNavParId(-1);
        return;
      }

      const prevSentId = navSentId > 0 ? navSentId - 1 : 0;

      const curParId = session.src.sentToParIds[navSentId];
      const prevParId = session.src.sentToParIds[prevSentId];

      if (curParId !== prevParId) {
        setNavParId(prevParId);
      }
      hideSentence(navSentId);
      setNavSentId(prevSentId);
      return;
    }

    // Paragraph
    if (navParId === -1) return;
    if (navParId === 0) {
      hideParagraph(navParId);
      setNavParId(-1);
      setNavSentId(-1);
      return;
    }

    const prevParId = navParId > 0 ? navParId - 1 : 0;
    const lastSentIdInPrevPar = getLastSentInPar(prevParId);

    hideParagraph(navParId);
    setNavParId(prevParId);
    setNavSentId(lastSentIdInPrevPar);
  }

  // Go to next sentence / paragraph
  const handleNext = (mode: "sentence" | "paragraph") => {
    if (!session) return;

    // Sentence
    if (mode === "sentence") {
      const maxSentId = getMaxSentId();

      if (navSentId < 0) {
        setNavSentId(0);
        setNavParId(session.src.sentToParIds[0]);
        revealSentence(0);
        return;
      }

      if (navSentId >= maxSentId) return;

      const nextSentId = findNextBlurredSentence(navSentId);
      if (nextSentId === null) return;

      const nextParId = session.src.sentToParIds[nextSentId];
      setNavParId(nextParId);
      setNavSentId(nextSentId);
      revealSentence(nextSentId);
      return;
    }

    // Paragraph
    const maxParId = getMaxParId();
    const curParId = navParId < 0 ? 0 : navParId;

    if (!isParagraphFullyRevealed(curParId)) {
      revealParagraph(curParId);
      setNavParId(curParId);
      setNavSentId(getLastSentInPar(curParId));
      return;
    }

    if (curParId >= maxParId) return;

    const nextParId = curParId + 1;
    revealParagraph(nextParId);
    setNavParId(nextParId);
    setNavSentId(getLastSentInPar(nextParId));
    return;
  }

  // -------------------------
  // Arrow Key Navigation
  // -------------------------
  useEffect(() => {
    if (!showAligned) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (popoverOpen) return;
      switch (e.key) {
        // Left: Previous Sentence
        case "ArrowLeft":
          e.preventDefault();
          handlePrev("sentence");
          break;
        // Right: Next Sentence
        case "ArrowRight":
          e.preventDefault();
          handleNext("sentence");
          break;
        // Up: Previous Paragraph
        case "ArrowUp":
          e.preventDefault();
          handlePrev("paragraph");
          break;
        // Down: Next Paragraph
        case "ArrowDown":
          e.preventDefault();
          handleNext("paragraph");
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    showAligned,
    popoverOpen,
    handlePrev,
    handleNext,
  ]);


  // -------------------------
  // Render
  // -------------------------
  const PANE_H = "h-[80vh]"

  return (
    <div>
      {/* -------------------------
      //* Source Text Input 
      //* ------------------------- */}
      {!showAligned && !translationLoading ? (
        <div className="mx-auto max-w-5xl px-4">
          <Pane title="English" className={`${PANE_H} flex flex-col`}>
            {/* Input Box */}
            <div className="flex-1 min-h-0">
              <AppTextarea
                className="h-full min-h-0 overflow-y-auto"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type some English text..."
              />
            </div>
            {/* Translate Button */}
            <div className="pt-6 shrink-0 flex justify-end">
              <Button
                onClick={translate_and_align}
                disabled={translationLoading}
                className="shadow"
              >
                Translate
              </Button>
            </div>
          </Pane>
        </div>
      ) : (
        <>
          {/* -------------------------
          //* Source / Target HoverText
          //* ------------------------- */}
          <div className="mx-auto max-w-5xl px-4">
            <Pane className={`${PANE_H} flex flex-col`}>
              {/* Pane Body */}
              <div className="flex-1 min-h-0">
                <TextSurface className="relative h-full flex flex-col overflow-hidden">
                  {/* Headers */}
                  <div className="grid grid-cols-2 border-b border-border text-sm font-medium text-muted-foreground">
                    <div className="px-4 py-2 border-r border-border">English</div>
                    <div className="px-4 py-2 pl-8">French</div>
                  </div>

                  {/* Aligned Paragraph Grid: [English] | [French] */}
                  <div className="relative flex-1 min-h-0">
                    <div className="relative h-full overflow-y-auto no-scrollbar pb-8">
                      {translationLoading || !session ? (
                        <div className="grid grid-cols-2">
                          <div className="border-r border-border p-4 pr-4">
                            <TextSkeleton blurClassName="blur-sm" />
                          </div>
                          <div className="p-4 pl-8">
                            <TextSkeleton />
                          </div>
                        </div>                    
                      ) : (
                        <ParagraphGrid 
                          session={session}
                          blurMode={blurMode}
                          blurredSource={blurredSource}
                          setBlurredSource={setBlurredSource}
                          sourceHighlightIndices={[
                            ...(activeSourceIndex !== null ? [activeSourceIndex] : []),
                            ...activeAlignedSource,
                          ]}
                          targetHighlightIndices={[
                            ...(activeTargetIndex !== null ? [activeTargetIndex] : []),
                            ...activeAlignedTarget,
                          ]}
                          onSourceHover={handleSourceHover}
                          onTargetHover={handleTargetHover}
                          onTargetWordClick={handleTargetWordClick}
                          targetDisabled={popoverOpen}
                        />
                      )}
                    </div>
                  </div>

                  {/* -------------------------
                  //* Internal Traversal Buttons
                  //* ------------------------- */}
                  {/* CONTROLS REGION (non-scrolling) */}
                  <div className="shrink-0 border-t border-border px-3 h-12 flex items-center">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full opacity-60 hover:opacity-100"
                          onClick={() => handlePrev("sentence")}
                          aria-label="Previous sentence"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="rounded-full opacity-60 hover:opacity-100"
                          onClick={() => handlePrev("paragraph")}
                          aria-label="Previous paragraph"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="rounded-full opacity-60 hover:opacity-100"
                          onClick={() => handleNext("paragraph")}
                          aria-label="Next paragraph"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full opacity-60 hover:opacity-100"
                          onClick={() => handleNext("sentence")}
                          aria-label="Next sentence"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TextSurface>
              </div>

              {/* Pane Footer */}
              <div className="mt-6 shrink-0 flex justify-center">
                <BlurModeToggle
                  value={blurMode}
                  onChange={setBlurMode}
                  className="shadow border"
                />
              </div>
            </Pane>

            {/* -------------------------
            /* Explain / Define Popover
            /* ------------------------- */}
            <AnchoredPopover
              open={popoverOpen}
              onOpenChange={(open) => {
                setPopoverOpen(open);

                if (!open) {
                  setTargetLocked(false);
                  setLockedTargetIndex(null);
                  setLockedSourceIndices([]);
                  setHoveredTargetIndex(null);
                  setHoveredSourceIndex(null);
                }
              }}
              anchorEl={anchorEl}
              className="min-w-[400px]"
            >
              {explanationLoading || !session ? (
                <ExplainSkeleton />
              ) : (
                <div className="p-4 space-y-4">
                  {defineData && <DefineCard data={defineData} />}
                  <div className="h-px bg-border" />
                  {explainData && <ExplainCard data={explainData} />}
                </div>
              )}
            </AnchoredPopover>
          </div>
        </>
      )}
    </div>
  );
}
