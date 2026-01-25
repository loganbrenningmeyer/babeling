"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { HoverText } from "../components/HoverText";
import { BlurMode, BlurModeToggle } from "../components/BlurModeToggle";
import { DefineEntry, DefineCard } from "../components/DefineCard";
import { ExplainEntry, ExplainCard } from "../components/ExplainCard";
import { Pane } from "../components/Pane";
import { AppTextarea } from "../components/AppTextarea";
import { TextSurface } from "../components/TextSurface";
import { AnchoredPopover } from "../components/AnchoredPopover";
import { ExplainSkeleton } from "../components/ExplainSkeleton";
import { TextSkeleton } from "../components/TextSkeleton";


type Session = {
  sourceText: string;
  targetText: string;

  src: {
    words: string[];
    spaces: string[];
    sentIds: number[];
    sentToParIds: Record<number, number>;
    sentIdToWords: Record<number, number[]>;
    parIds: number[];
    parToSentIds: Record<number, number[]>;
    parIdToWords: Record<number, number[]>;
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

  const [blurMode, setBlurMode] = useState<BlurMode>("sentence");
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
        sentIdToWords: align_data.src_sent_id_to_words,
        parIds: align_data.src_par_ids,
        parToSentIds: align_data.src_par_to_sent_ids,
        parIdToWords: align_data.src_par_id_to_words,
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
  // Internal text traversal
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
    const idxs = session.src.sentIdToWords[sentId];
    revealWordIndices(idxs);
  }

  function revealParagraph(parId: number) {
    if (!session) return;
    const idxs = session.src.parIdToWords[parId];
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
    const idxs = session.src.sentIdToWords[sentId];
    hideWordIndices(idxs);
  }

  function hideParagraph(parId: number) {
    if (!session) return;
    const idxs = session.src.parIdToWords[parId];
    hideWordIndices(idxs);
  }

  function isParagraphFullyRevealed(parId: number) {
    if (!session) return true;
    const idxs = session.src.parIdToWords[parId] ?? [];
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

      const nextSentId = navSentId + 1;

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
  // Render
  // -------------------------
  return (
    <div>
      {/* -------------------------
      //* Source Text Input 
      //* ------------------------- */}
      {!showAligned && !translationLoading ? (
        <div className="mx-auto max-w-5xl px-4">
          <Pane title="English">
            <AppTextarea
              className="h-[70vh] overflow-hidden pb-8"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type some English text..."
            />
            <Button
              onClick={translate_and_align}
              disabled={translationLoading}
              className="mt-6 shadow"
            >
              Translate
            </Button>
          </Pane>
        </div>
      ) : (
        <>
          {/* -------------------------
          //* Source / Target HoverText
          //* ------------------------- */}
          <div className="mx-auto max-w-5xl px-4">
            <Pane>
              <TextSurface className="relative h-[70vh] flex flex-col overflow-hidden pb-8">
                {/* Headers */}
                <div className="grid grid-cols-2 border-b border-border text-sm font-medium text-muted-foreground">
                  <div className="px-4 py-2 border-r border-border">English</div>
                  <div className="px-4 py-2 pl-8">French</div>
                </div>
                
                {/* [English] | [French] */}
                <div className="grid grid-cols-2 flex-1 min-h-0 overflow-y-auto no-scrollbar">
                  {/* -------------------------
                  //* Left: English
                  //* ------------------------- */}
                  <div className="border-r border-border p-4 pr-4">
                    {/* Body */}
                    {translationLoading || !session ? (
                      <TextSkeleton blurClassName="blur-sm" />
                    ) : (
                      <HoverText
                        variant="source"
                        words={session.src.words}
                        spaces={session.src.spaces}
                        onHover={handleSourceHover}
                        highlightIndices={[
                          ...(activeSourceIndex !== null ? [activeSourceIndex] : []),
                          ...activeAlignedSource,
                        ]}
                        blur={{
                          mode: blurMode,
                          sentIds: session.src.sentIds,
                          parIds: session.src.parIds,
                          sentIdToWords: session.src.sentIdToWords,
                          parIdToWords: session.src.parIdToWords,

                          blurred: blurredSource,
                          setBlurred: setBlurredSource,
                        }}
                      />
                    )}
                  </div>

                  {/* -------------------------
                  //* Right: French
                  //* ------------------------- */}
                  {/* Body */}
                  <div className="p-4 pl-8">
                    {translationLoading || !session ? (
                      <TextSkeleton />
                    ) : (
                      <HoverText
                        variant="target"
                        disabled={popoverOpen}
                        words={session.tgt.words}
                        spaces={session.tgt.spaces}
                        onHover={handleTargetHover}
                        highlightIndices={[
                          ...(activeTargetIndex !== null ? [activeTargetIndex] : []),
                          ...activeAlignedTarget,
                        ]}
                        onWordClick={handleTargetWordClick}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom fade overlay */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 
                                bg-gradient-to-t from-background to-transparent" />

                {/* -------------------------
                //* Internal Traversal Buttons
                //* ------------------------- */}
                {/* Previous Sentence */}
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-3 left-3 z-10 rounded-full opacity-60 hover:opacity-100"
                  onClick={() => handlePrev("sentence")}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Previous Paragraph */}
                <Button 
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 left-12 z-10 rounded-full opacity-60 hover:opacity-100"
                  onClick={() => handlePrev("paragraph")}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Next Sentence */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute bottom-3 right-3 z-10 rounded-full opacity-60 hover:opacity-100"
                  onClick={() => handleNext("sentence")}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Next Paragraph */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 right-12 z-10 rounded-full opacity-60 hover:opacity-100"
                  onClick={() => handleNext("paragraph")}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TextSurface>

              {/* Toggle Blur Mode */}
              <div className="grid grid-cols-2 mt-6">
                <div className="col-span-2 flex justify-center">
                  <BlurModeToggle
                    value={blurMode}
                    onChange={setBlurMode}
                    className="shadow border"
                  />
                </div>
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
