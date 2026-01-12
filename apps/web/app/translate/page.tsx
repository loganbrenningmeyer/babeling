"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";

import { HoverText } from "../components/HoverText";
import { BlurMode, BlurModeToggle } from "../components/BlurModeToggle";
import { DefinitionEntry, DefinitionCard } from "../components/DefinitionCard";

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
  }
}

export default function Translate() {
  // -------------------------
  // Core state
  // -------------------------
  const [sourceText, setSourceText] = useState("");
  const [explainText, setExplainText] = useState("");
  const [definition, setDefinition] = useState<DefinitionEntry | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [showAligned, setShowAligned] = useState(false);
  // -------------------------
  // Interaction state
  // -------------------------
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(null);

  // -------------------------
  // Derived values
  // -------------------------
  const alignedSourceIndices = 
    hoveredTargetIndex !== null ? session?.align.tgtToSrc[hoveredTargetIndex] ?? [] : [];
  const alignedTargetIndices = 
    hoveredSourceIndex !== null ? session?.align.srcToTgt[hoveredSourceIndex] ?? [] : [];

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
      body: JSON.stringify({ source: sourceText })
    });
    const translate_data = await translate_res.json();
    const target = translate_data.translation

    // Align
    const align_res = await fetch("/api/align", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        source: sourceText, 
        target
      })
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
        parIdToWords: align_data.src_par_id_to_words
      },
      tgt: {
        words: align_data.tgt_words,
        spaces: align_data.tgt_spaces
      },
      align: {
        srcToTgt: align_data.src_to_tgt,
        tgtToSrc: align_data.tgt_to_src
      }
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
    setExplainText("");
    setDefinition(null);
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
        tgt_idx: targetIndex
      })
    });
    const data = await res.json();

    setExplainText(data.explanation);
    setDefinition(data.definition);
    setExplanationLoading(false);
  }

  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {!showAligned && !translationLoading ? (
        <>
          {/* Source Text */}
          <Card>
            <CardHeader>
              <CardTitle>English</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Type some English text..."
                className="
                  min-h-[40vh] resize-none
                  !text-base font-sans leading-6
                  border-0 p-4 
                  focus-visible:ring-0 focus-visible:ring-offset-0
                  shadow
                "
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
              <Button 
                onClick={translate_and_align} 
                disabled={translationLoading}
                className="mt-4 shadow"
              >
                {translationLoading ? "Translating and Aligning..." : "Translate"}
              </Button>
            </CardContent>
          </Card>

          {/* Target Text */}
          <Card>
            <CardHeader>
              <CardTitle>French</CardTitle>
            </CardHeader>
            <CardContent>
              {session && (
                <Textarea
                  placeholder={translationLoading ? "Translating..." : ""}
                  className="
                    min-h-[40vh] resize-none
                    !text-base font-sans leading-6
                    border-0 p-4 
                    focus-visible:ring-0 focus-visible:ring-offset-0
                    shadow
                  "
                  value={session.targetText}
                  readOnly
                />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* English HoverText */}
          <Card>
            <CardHeader>
              <CardTitle>English</CardTitle>
            </CardHeader>
            <CardContent>
              {translationLoading || !session ? (
                <div className="min-h-[40vh] rounded-md bg-muted animate-pulse" />
              ) : (
                // {session && (
                <HoverText 
                  variant="source"
                  words={session.src.words}
                  spaces={session.src.spaces}
                  onHover={setHoveredSourceIndex}
                  highlightIndices={[
                    ...(hoveredSourceIndex !== null ? [hoveredSourceIndex] : []),
                    ...alignedSourceIndices
                  ]}
                  blur={{
                    mode: blurMode,
                    sentIds: session.src.sentIds,
                    parIds: session.src.parIds,
                    sentIdToWords: session.src.sentIdToWords,
                    parIdToWords: session.src.parIdToWords
                  }}
                />
                // )}

              )}

              <div className="flex mt-4 gap-3 items-center">
                <Button 
                  onClick={translateAgain}
                  className="shadow"
                >
                  {"Translate again"}
                </Button>
                <BlurModeToggle value={blurMode} onChange={setBlurMode} />
              </div>
            </CardContent>
          </Card>

          {/* French HoverText */}
          <Card>
            <CardHeader>
              <CardTitle>French</CardTitle>
            </CardHeader>
            <CardContent>
              {translationLoading || !session ? (
                <div className="min-h-[40vh] rounded-md bg-muted animate-pulse" />
              ) : (
              // {session && (
                <HoverText 
                  variant="target"
                  words={session.tgt.words}
                  spaces={session.tgt.spaces}
                  onHover={setHoveredTargetIndex}
                  highlightIndices={[
                    ...(hoveredTargetIndex !== null ? [hoveredTargetIndex] : []),
                    ...alignedTargetIndices
                  ]}
                  onWordClick={explainTargetWord}
                />
              )}
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              {explanationLoading ? (
                <div className="h-[20vh] rounded-md 
                  bg-gradient-to-r from-muted via-muted-foreground/10 to-muted
                  animate-pulse" 
                />
              ) : (
                <Textarea
                  placeholder={explanationLoading ? "Getting explanation..." : "Click a French word to get an explanation..."}
                  className="
                    min-h-[20vh] resize-none
                    !text-base font-sans leading-6
                    border-0 p-4 
                    focus-visible:ring-0 focus-visible:ring-offset-0
                    shadow
                  "
                  value={explainText}
                  readOnly
                />
              )}
            </CardContent>
          </Card>

          {/* Definition */}
          <Card>
            <CardHeader>
              <CardTitle>Definition</CardTitle>
            </CardHeader>
            <CardContent>
              {explanationLoading ? (
                <div className="h-[20vh] rounded-md 
                  bg-gradient-to-r from-muted via-muted-foreground/10 to-muted
                  animate-pulse" 
                />
              ) : (
                <DefinitionCard definition={definition}/>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
