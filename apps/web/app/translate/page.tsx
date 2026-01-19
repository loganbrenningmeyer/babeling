"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { HoverText } from "../components/HoverText";
import { BlurMode, BlurModeToggle } from "../components/BlurModeToggle";
import { DefinitionEntry, DefinitionCard } from "../components/DefinitionCard";
import {
  ExplanationEntry,
  ExplanationCard,
} from "../components/ExplanationCard";
import { Pane } from "../components/Pane";
import { AppTextarea } from "../components/AppTextarea";
import { TextSurface } from "../components/TextSurface";
import { LoadingSurface } from "../components/LoadingSurface";

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
  const [explanationData, setExplanationData] =
    useState<ExplanationEntry | null>(null);
  const [definitionData, setDefinitionData] = useState<DefinitionEntry | null>(
    null
  );
  const [session, setSession] = useState<Session | null>(null);
  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [blurMode, setBlurMode] = useState<BlurMode>("sentence");
  const [showAligned, setShowAligned] = useState(false);
  // -------------------------
  // Interaction state
  // -------------------------
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
    const target = translate_data.translation;

    // Align
    const align_res = await fetch("/api/align", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: sourceText,
        target,
      }),
    });
    const align_data = await align_res.json();

    // Update session
    setSession({
      sourceText,
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
      },
      align: {
        srcToTgt: align_data.src_to_tgt,
        tgtToSrc: align_data.tgt_to_src,
      },
    });

    setTranslationLoading(false);
    setShowAligned(true);
  }

  function translateAgain() {
    setShowAligned(false);
    setHoveredSourceIndex(null);
    setHoveredTargetIndex(null);
    setSourceText("");
    setSession(null);
    setExplanationData(null);
    setDefinitionData(null);
  }

  async function explainTargetWord(targetIndex: number) {
    if (!session) return;

    setExplanationLoading(true);

    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src_words: session.src.words,
        tgt_words: session.tgt.words,
        src_spaces: session.src.spaces,
        tgt_spaces: session.tgt.spaces,
        tgt_to_src: session.align.tgtToSrc,
        tgt_idx: targetIndex,
      }),
    });
    const data = await res.json();

    setExplanationData({
      explanation: data.explanation.explanation,
      examples: data.explanation.examples,
    });
    setDefinitionData({
      word: data.definition.word,
      pos: data.definition.pos,
      definition: data.definition.definition,
      pronunciation: data.definition.pronunciation,
      infinitive: data.definition.infinitive,
    });
    setExplanationLoading(false);
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {!showAligned && !translationLoading ? (
        <>
          {/* -------------------------
           /* English Source Text
           /* ------------------------- */}
          <Pane title="English">
            <AppTextarea
              className="min-h-[40vh]"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Type some English text..."
            />
            <Button
              onClick={translate_and_align}
              disabled={translationLoading}
              className="mt-4 shadow"
            >
              {translationLoading ? "Translating and Aligning..." : "Translate"}
            </Button>
          </Pane>

          {/* -------------------------
           /* French Target Text
           /* ------------------------- */}
          <Pane title="French">
            <TextSurface className="min-h-[40vh]">
              {session?.targetText ?? (
                <span className="text-muted-foreground">
                  Waiting for translation...
                </span>
              )}
            </TextSurface>
          </Pane>
        </>
      ) : (
        <>
          {/* -------------------------
           /* English HoverText
           /* ------------------------- */}
          <Pane title="English">
            {translationLoading || !session ? (
              <LoadingSurface className="min-h-[40vh]" />
            ) : (
              <TextSurface className="min-h-[40vh]">
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
                  }}
                />
              </TextSurface>
            )}

            {/* Buttons: Translate again / Blur mode */}
            <div className="flex mt-4 gap-3 items-center">
              <Button onClick={translateAgain} className="shadow">
                {"Translate again"}
              </Button>
              <BlurModeToggle value={blurMode} onChange={setBlurMode} />
            </div>
          </Pane>

          {/* -------------------------
           /* French HoverText
           /* ------------------------- */}
          <Pane title="French">
            {translationLoading || !session ? (
              <LoadingSurface className="min-h-[40vh]" />
            ) : (
              <TextSurface className="min-h-[40vh]">
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
                  onWordClick={explainTargetWord}
                />
              </TextSurface>
            )}
          </Pane>

          {/* -------------------------
           /* Explanation
           /* ------------------------- */}
          <Pane title="Explanation">
            {explanationLoading ? (
              <LoadingSurface className="min-h-[20vh]" />
            ) : (
              <TextSurface className="min-h-[20vh]">
                <ExplanationCard data={explanationData} />
              </TextSurface>
            )}
          </Pane>

          {/* -------------------------
           /* Definition
           /* ------------------------- */}
          <Pane title="Definition">
            {explanationLoading ? (
              <LoadingSurface className="min-h-[20vh]" />
            ) : (
              <TextSurface className="min-h-[20vh]">
                <DefinitionCard data={definitionData} />
              </TextSurface>
            )}
          </Pane>
        </>
      )}
    </div>
  );
}
