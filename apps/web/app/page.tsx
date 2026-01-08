"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";

import { HoverText } from "./components/HoverText";

type AlignmentMap = Record<number, number[]>;


export default function About() {
  // Raw source / target strings
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  // Word-tokenized source / target lists
  const [sourceWords, setSourceWords] = useState<string[]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);
  const [sourceSpaces, setSourceSpaces] = useState<string[]>([]);
  const [targetSpaces, setTargetSpaces] = useState<string[]>([]);
  // Currently hovered word index
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(null);
  // word index -> aligned word indices mapping
  const [srcToTgt, setSrcToTgt] = useState<AlignmentMap>({});
  const [tgtToSrc, setTgtToSrc] = useState<AlignmentMap>({});

  const [translationLoading, setTranslationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);

  async function translate_and_align() {
    if (!sourceText.trim()) return;

    setTranslationLoading(true);

    // ---------- 
    // Translate 
    // ----------
    const translate_res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: sourceText })
    });

    // Set translated text
    const translate_data = await translate_res.json();
    const target = translate_data.translation
    setTargetText(target);

    // ----------
    // Align
    // ----------
    const align_res = await fetch("/api/align", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        source: sourceText, 
        target,
      })
    });

    const align_data = await align_res.json();

    // Set HoverText words <string []>
    setSourceWords(align_data.src_words);
    setTargetWords(align_data.tgt_words);
    setSourceSpaces(align_data.src_spaces);
    setTargetSpaces(align_data.tgt_spaces);
    // Word alignment mappings Record<number, number[]>
    setSrcToTgt(align_data.src_to_tgt);
    setTgtToSrc(align_data.tgt_to_src);

    setTranslationLoading(false);
    setShowAligned(true);
  }

  const alignedSourceIndices = 
    hoveredTargetIndex !== null ? tgtToSrc[hoveredTargetIndex] ?? [] : [];
  const alignedTargetIndices = 
    hoveredSourceIndex !== null ? srcToTgt[hoveredSourceIndex] ?? [] : [];

  function translateAgain() {
    setShowAligned(false);
    setHoveredSourceIndex(null);
    setHoveredTargetIndex(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {!showAligned ? (
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
                  min-h-[40vh]
                  text-sm font-sans leading-6
                  border-0 p-0 
                  focus-visible:ring-0
                  focus-visible:ring-offset-0
                "
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />

              <Button 
                onClick={translate_and_align} 
                disabled={translationLoading}
                className="mt-4"
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
              <Textarea
                placeholder={translationLoading ? "Translating..." : ""}
                className="
                  min-h-[40vh]
                  text-sm font-sans leading-6
                  border-0 p-0 
                  focus-visible:ring-0
                  focus-visible:ring-offset-0
                "
                value={targetText}
                readOnly
              />
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
              <HoverText 
                words={sourceWords}
                spaces={sourceSpaces}
                onHover={setHoveredSourceIndex}
                highlightIndices={[
                  ...(hoveredSourceIndex !== null ? [hoveredSourceIndex] : []),
                  ...alignedSourceIndices
                ]}
                textType="source"
              />
              <Button 
                onClick={translateAgain} 
                className="mt-4"
              >
                {"Translate again"}
              </Button>
            </CardContent>
          </Card>

          {/* French HoverText */}
          <Card>
            <CardHeader>
              <CardTitle>French</CardTitle>
            </CardHeader>
            <CardContent>
              <HoverText 
                words={targetWords}
                spaces={targetSpaces}
                onHover={setHoveredTargetIndex}
                highlightIndices={[
                  ...(hoveredTargetIndex !== null ? [hoveredTargetIndex] : []),
                  ...alignedTargetIndices
                ]}
                textType="target"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
