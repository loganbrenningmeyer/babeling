"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    parIds: number[];
    sentIdToWords: Record<number, number[]>;
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
  const [showAligned, setShowAligned] = useState(false);
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());
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
  const alignedSourceIndices =
    hoveredTargetIndex !== null
      ? (session?.align.tgtToSrc[hoveredTargetIndex] ?? [])
      : [];
  const alignedTargetIndices =
    hoveredSourceIndex !== null
      ? (session?.align.srcToTgt[hoveredSourceIndex] ?? [])
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
        parIds: align_data.src_par_ids,
        sentIdToWords: align_data.src_sent_id_to_words,
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

    // -------------------------
    // Unblur aligned English words
    // -------------------------
    const srcIdxs = session.align.tgtToSrc[i] ?? [];
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
              className="min-h-[60vh]"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type some English text..."
            />
            <Button
              onClick={translate_and_align}
              disabled={translationLoading}
              className="mt-6 shadow"
            >
              {translationLoading ? "Translating and Aligning..." : "Translate"}
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
              <TextSurface className="min-h-[60vh]">
                {/* Column headers */}
                <div className="grid grid-cols-2 border-b border-border text-sm font-medium text-muted-foreground">
                  <div className="px-4 py-2 border-r border-border">
                    English
                  </div>
                  <div className="px-4 py-2 pl-8">French</div>
                </div>

                {/* Column content */}
                <div className="grid grid-cols-2 flex-1">
                  {/* -------------------------
                  //* Left: English
                  //* ------------------------- */}
                  <div className="p-4 pr-6 border-r border-border">
                    {translationLoading || !session ? (
                      <TextSkeleton blurClassName="blur-sm" />
                    ) : (
                      <HoverText
                        variant="source"
                        words={session.src.words}
                        spaces={session.src.spaces}
                        onHover={setHoveredSourceIndex}
                        highlightIndices={[
                          ...(hoveredSourceIndex !== null
                            ? [hoveredSourceIndex]
                            : []),
                          ...alignedSourceIndices,
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
                  <div className="p-4 pl-8">
                    {translationLoading || !session ? (
                      <TextSkeleton />
                    ) : (
                      <HoverText
                        variant="target"
                        words={session.tgt.words}
                        spaces={session.tgt.spaces}
                        onHover={setHoveredTargetIndex}
                        highlightIndices={[
                          ...(hoveredTargetIndex !== null
                            ? [hoveredTargetIndex]
                            : []),
                          ...alignedTargetIndices,
                        ]}
                        onWordClick={handleTargetWordClick}
                      />
                    )}
                  </div>
                </div>
              </TextSurface>

              {/* Buttons: Translate again / Blur mode */}
              <div className="flex items-center mt-6 gap-6">
                <Button onClick={translateAgain} className="shadow">
                  {"Translate again"}
                </Button>
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
              onOpenChange={setPopoverOpen}
              anchorEl={anchorEl}
              className="min-h-[500px] min-w-[400px]"
            >
              {explanationLoading || !session ? (
                <ExplainSkeleton />
              ) : (
                <div className="p-4 space-y-4">
                  <DefineCard data={defineData} />
                  <div className="h-px bg-border" />
                  <ExplainCard data={explainData} />
                </div>
              )}
            </AnchoredPopover>
          </div>
        </>
      )}
    </div>
  );
}
