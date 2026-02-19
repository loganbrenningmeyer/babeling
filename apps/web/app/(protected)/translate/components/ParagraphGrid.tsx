"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

import { HoverText } from "@/app/(protected)/translate/components/HoverText/HoverText";
import type { BlurMode } from "@/app/(protected)/translate/components/SourceBlur/BlurModeToggle";
import type { Session } from "@/types/session";

type ParagraphGridProps = {
  session: Session;

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
  if (out[last].includes("\n\n")) out[last] = "\n";
  return out;
}

// Get target paragraph id --> word idx map
function buildTgtParToWordIds(session: Session) {
  const out: Record<number, number[]> = {};
  for (let i = 0; i < session.tgt.words.length; i++) {
    const sentId = session.tgt.sentIds[i];
    const parId = session.src.sentToParIds[sentId];
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
}: ParagraphGridProps) {
  // Get unique paragraph IDs
  const parIds = useMemo(() => {
    const uniq = Array.from(new Set(session.src.parIds));
    uniq.sort((a, b) => a - b);
    return uniq;
  }, [session.src.parIds]);

  const tgtParToWordIds = useMemo(() => buildTgtParToWordIds(session), [session]);

  return (
    <div className={cn("relative min-h-full", className)}>
      {parIds.map((parId, idx) => {
        const srcIdxs = session.src.parToWordIds[parId];
        const tgtIdxs = tgtParToWordIds[parId];

        const srcSlice = sliceWordsSpaces(session.src.words, session.src.spaces, srcIdxs);
        srcSlice.spaces = stripTrailingParagraphBreak(srcSlice.spaces);
        const tgtSlice = sliceWordsSpaces(session.tgt.words, session.tgt.spaces, tgtIdxs);
        tgtSlice.spaces = stripTrailingParagraphBreak(tgtSlice.spaces);

        return (
          <div key={parId} className="grid grid-cols-2">
            {/* Left: Source paragraph */}
            <div className="my-4 mx-8 mr-10">
              <HoverText
                variant="source"
                words={srcSlice.words}
                spaces={srcSlice.spaces}
                indexOffset={srcSlice.offset}
                onHover={onSourceHover}
                highlightIndices={sourceHighlightIndices}
                blur={{
                  mode: blurMode,
                  sentIds: session.src.sentIds,
                  parIds: session.src.parIds,
                  sentToWordIds: session.src.sentToWordIds,
                  parToWordIds: session.src.parToWordIds,
                  blurred: blurredSource,
                  setBlurred: setBlurredSource,
                }}
                className="text-muted-foreground"
              />
            </div>

            {/* Right: Target paragraph */}
            <div className="my-4 mr-8 ml-12">
              <HoverText
                variant="target"
                words={tgtSlice.words}
                spaces={tgtSlice.spaces}
                indexOffset={tgtSlice.offset}
                disabled={targetDisabled}
                onHover={onTargetHover}
                highlightIndices={targetHighlightIndices}
                onWordClick={onTargetWordClick}
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
