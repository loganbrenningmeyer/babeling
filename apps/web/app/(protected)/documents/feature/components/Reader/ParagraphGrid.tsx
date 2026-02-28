"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

import { HoverText } from "@/app/(protected)/documents/feature/components/HoverText/HoverText";
import type { BlurMode } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import type { ReaderSession } from "../../types/readerSession";

type ParagraphGridProps = {
  session: ReaderSession;

  // Blur
  blurMode: BlurMode;
  blurredSource: Set<number>;
  setBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;

  // Highlight + hover
  sourceHighlightIndices: number[];
  targetHighlightIndices: number[];
  onSourceHover?: (idx: number | null) => void;
  onTargetHover?: (idx: number | null) => void;

  // Target click
  onTargetWordClick?: (idx: number, el: HTMLElement) => void;
  targetDisabled?: boolean;

  className?: string;
  gapAndPad?: string;
}

// Slice words/spaces by idxs range
function sliceWordsSpaces(words: string[], spaces: string[], idxs: number[]) {
  const start = Math.min(...idxs);
  const end = Math.max(...idxs);

  return {
    words: words.slice(start, end + 1),
    spaces: spaces.slice(start, end + 1),
    offset: start,
  }
}

// Strip double newlines to single
function stripTrailingParagraphBreak(spaces: string[]) {
  if (!spaces.length) return spaces;
  const out = [...spaces];
  const last = out.length - 1;
  out[last] = out[last].replace(/\n+$/, "");
  return out;
}

// Get target paragraph id --> word idx map
function buildTgtParToWordIds(session: ReaderSession) {
  const out: Record<number, number[]> = {};
  for (let i = 0; i < session.alignment.tgt.words.length; i++) {
    const sentId = session.alignment.tgt.sentIds[i];
    const parId = session.alignment.src.sentToParIds[sentId];
    (out[parId] ??= []).push(i);
  }
  return out;
}


// -------------------------
// [Source] | [Target] HoverTexts with paragraphs aligned horizontally
// -------------------------
export function ParagraphGrid({
  session,
  blurMode,
  blurredSource,
  setBlurredSource,
  sourceHighlightIndices,
  targetHighlightIndices,
  onSourceHover,
  onTargetHover,
  onTargetWordClick,
  targetDisabled,
  className,  
  gapAndPad,
}: ParagraphGridProps) {
  // Get unique paragraph IDs
  const parIds = useMemo(() => {
    const uniq = Array.from(new Set(session.alignment.src.parIds));
    uniq.sort((a, b) => a - b);
    return uniq;
  }, [session.alignment.src.parIds]);

  const tgtParToWordIds = useMemo(() => buildTgtParToWordIds(session), [session]);

  return (
    <div className={cn("relative min-h-full", className)}>
      {parIds.map((parId, idx) => {
        const srcIdxs = session.alignment.src.parToWordIds[parId];
        const tgtIdxs = tgtParToWordIds[parId];

        const srcSlice = sliceWordsSpaces(session.alignment.src.words, session.alignment.src.spaces, srcIdxs);
        srcSlice.spaces = stripTrailingParagraphBreak(srcSlice.spaces);
        const tgtSlice = sliceWordsSpaces(session.alignment.tgt.words, session.alignment.tgt.spaces, tgtIdxs);
        tgtSlice.spaces = stripTrailingParagraphBreak(tgtSlice.spaces);

        return (
          <div key={parId} className={`grid grid-cols-2 py-4 ${gapAndPad ?? ""}`}>
            {/* Left: Source paragraph */}
            <div>
              <HoverText
                variant="source"
                words={srcSlice.words}
                spaces={srcSlice.spaces}
                indexOffset={srcSlice.offset}
                onHover={onSourceHover}
                highlightIndices={sourceHighlightIndices}
                blur={{
                  mode: blurMode,
                  sentIds: session.alignment.src.sentIds,
                  parIds: session.alignment.src.parIds,
                  sentToWordIds: session.alignment.src.sentToWordIds,
                  parToWordIds: session.alignment.src.parToWordIds,
                  blurred: blurredSource,
                  setBlurred: setBlurredSource,
                }}
                indentFirstLine={true}
                className="text-muted-foreground"
              />
            </div>

            {/* Right: Target paragraph */}
            <div>
              <HoverText
                variant="target"
                words={tgtSlice.words}
                spaces={tgtSlice.spaces}
                indexOffset={tgtSlice.offset}
                disabled={targetDisabled}
                onHover={onTargetHover}
                highlightIndices={targetHighlightIndices}
                onWordClick={onTargetWordClick}
                indentFirstLine={true}
              />
            </div>

            {/* Row 2: aligned inset dividers (two separate lines) */}
            {idx < parIds.length - 1 && (
              <>
                <div className="border-r border-border px-12">
                  <div className="h-0.25 bg-border/60" />
                </div>
                <div className="px-12">
                  <div className="h-0.25 bg-border/60" />
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  );  
}
