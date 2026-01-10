"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";

import { HoverText } from "../components/HoverText";
import { BlurMode, BlurModeToggle } from "../components/BlurModeToggle";

type AlignmentMap = Record<number, number[]>;
type IdToWords = Record<number, number[]>;

export default function Translate() {
  // Raw source / target strings
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  // Word-tokenized source / target lists
  const [sourceWords, setSourceWords] = useState<string[]>([]);
  const [targetWords, setTargetWords] = useState<string[]>([]);

  const [sourceSpaces, setSourceSpaces] = useState<string[]>([]);
  const [targetSpaces, setTargetSpaces] = useState<string[]>([]);

  const [sourceSentIds, setSourceSentIds] = useState<number[]>([]);
  const [sourceParIds, setSourceParIds] = useState<number[]>([]);
  const [sourceSentIdToWords, setSourceSentIdToWords] = useState<IdToWords>({});
  const [sourceParIdToWords, setSourceParIdToWords] = useState<IdToWords>({});

  // Currently hovered word index
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null);
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(null);
  // word index -> aligned word indices mapping
  const [srcToTgt, setSrcToTgt] = useState<AlignmentMap>({});
  const [tgtToSrc, setTgtToSrc] = useState<AlignmentMap>({});
  // Blur mode toggle
  const [blurMode, setBlurMode] = useState<BlurMode>("word");

  const [translationLoading, setTranslationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);

  // ----------
  // Translate text and compute source/target alignments
  // ----------
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

    setSourceSentIds(align_data.src_sent_ids);
    setSourceParIds(align_data.src_par_ids);
    
    setSourceSentIdToWords(align_data.src_sent_id_to_words);
    setSourceParIdToWords(align_data.src_par_id_to_words);

    // Word alignment mappings Record<number, number[]>
    setSrcToTgt(align_data.src_to_tgt);
    setTgtToSrc(align_data.tgt_to_src);

    setTranslationLoading(false);
    setShowAligned(true);
  }

  // ----------
  // Aligned word indices given hovered word
  // ----------  
  const alignedSourceIndices = 
    hoveredTargetIndex !== null ? tgtToSrc[hoveredTargetIndex] ?? [] : [];
  const alignedTargetIndices = 
    hoveredSourceIndex !== null ? srcToTgt[hoveredSourceIndex] ?? [] : [];

  // ----------
  // Reset translation for new input
  // ----------
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
                  min-h-[40vh] resize-none
                  !text-base font-sans leading-6
                  border-0 p-4 
                  focus-visible:ring-0 focus-visible:ring-offset-0
                  shadow
                "
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
              />
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
                  min-h-[40vh] resize-none
                  !text-base font-sans leading-6
                  border-0 p-4 
                  focus-visible:ring-0 focus-visible:ring-offset-0
                  shadow
                "
                value={targetText}
                readOnly
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
                sentIds={sourceSentIds}
                parIds={sourceParIds}
                sentIdToWords={sourceSentIdToWords}
                parIdToWords={sourceParIdToWords}
                onHover={setHoveredSourceIndex}
                highlightIndices={[
                  ...(hoveredSourceIndex !== null ? [hoveredSourceIndex] : []),
                  ...alignedSourceIndices
                ]}
                textType="source"
                blurMode={blurMode}
              />

              <BlurModeToggle value={blurMode} onChange={setBlurMode} />
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
                blurMode="word"
              />
              <Button 
                onClick={translateAgain} 
                className="mt-4"
              >
                {"Translate again"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
