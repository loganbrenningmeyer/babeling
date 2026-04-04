import React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { BlurMode } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import { buildClusters } from "@/lib/textClusters";

type IdToWords = Record<number, number[]>;

type BlurConfig = {
  mode: BlurMode;
  sentIds: number[];
  parIds: number[];
  sentToWordIds: IdToWords;
  parToWordIds: IdToWords;
  blurred?: Set<number>;
  setBlurred?: React.Dispatch<React.SetStateAction<Set<number>>>;
};

type HoverTextProps = {
  words: string[];
  spaces: string[];
  indexOffset?: number;
  highlightIndices?: number[];
  highlightClassName: string;
  onHover?: (index: number | null) => void;
  onWordClick?: (index: number, el: HTMLElement) => void;
  blur?: BlurConfig;
  disabled?: boolean;
  indentFirstLine?: boolean;
  className?: string;
};

export function HoverText({
  words,
  spaces,
  indexOffset = 0,
  highlightIndices = [],
  highlightClassName,
  onHover,
  onWordClick,
  blur,
  disabled,
  indentFirstLine,
  className,
}: HoverTextProps) {
  // Toggle blur/unblur (initially all blurred source)
  const [internalBlurred, internalSetBlurred] = useState<Set<number>>(() =>
    blur ? new Set(words.map((_, i) => i)) : new Set()
  );

  const blurred = blur?.blurred ?? internalBlurred;
  const setBlurred = blur?.setBlurred ?? internalSetBlurred;

  // -------------------------
  // Toggle source blur by word / sentence / paragraph
  // -------------------------
  const toggleBlur = (i: number) => {
    // Do not blur target text
    if (!blur) return;

    setBlurred((prev) => {
      const next = new Set(prev);
      const wordIsBlurred = next.has(i);

      // Word blur
      if (blur.mode === "word") {
        if (wordIsBlurred) {
          next.delete(i);
        } else {
          next.add(i);
        }
        return next;
      }

      // Sentence blur
      if (blur.mode === "sentence") {
        const sentId = blur.sentIds[i];
        const idxs = blur.sentToWordIds[sentId];
        for (const j of idxs) {
          // Toggle sentence with clicked word
          if (next.has(j) === wordIsBlurred) {
            if (next.has(j)) {
              next.delete(j);
            } else {
              next.add(j);
            }
          }
        }
        return next;
      }

      // Paragraph blur
      if (blur.mode === "paragraph") {
        const parId = blur.parIds[i];
        const idxs = blur.parToWordIds[parId];
        for (const j of idxs) {
          // Toggle paragraph with clicked word
          if (next.has(j) === wordIsBlurred) {
            if (next.has(j)) {
              next.delete(j);
            } else {
              next.add(j);
            }
          }
        }
        return next;
      }

      return next;
    });
  };

  // -------------------------
  // (source): blur / (target): explain
  // -------------------------
  const handleClick = (i: number, e: React.MouseEvent) => {
    // If blur is enabled, click toggles blur
    if (blur) toggleBlur(i);
    // Otherwise, use click handler
    onWordClick?.(i, e.currentTarget as HTMLElement);
  };

  function renderSpace(space: string) {
    if (!space) return null;

    // Split on newlines and insert <br/>
    const parts = space.split("\n");

    // If there are no newlines, just render the string
    if (parts.length === 1) return parts[0];

    const out: React.ReactNode[] = [];
    for (let k = 0; k < parts.length; k++) {
      if (k > 0) out.push(<br key={`br-${k}`} />);
      // Render the chunk after each newline (could be indentation spaces)
      if (parts[k].length > 0) out.push(parts[k]);
    }
    return out;
  }

  const clusters = buildClusters(words, spaces);
  const highlightSet = new Set(highlightIndices);

  return (
    <p 
      className={cn(
        "font-reading whitespace-pre-wrap text-left", 
        disabled ? "pointer-events-none" : "",  
        className
      )}
    >
      {/* -------------------------
      * First Line Indent
      * ------------------------- */}
      {indentFirstLine && (
        <span
          aria-hidden
          className="inline-block w-[1.5em]"
        />
      )}

      {clusters.map((c) => {
        const baseIndex = c.anchorLocalIndex + indexOffset;
        const isHighlighted = Array.from(
          { length: c.end - c.start + 1 },
          (_, i) => c.start + i + indexOffset
        ).some((idx) => highlightSet.has(idx));
        const isBlurred = blur ? blurred.has(baseIndex) : false;

        return (
          <span key={baseIndex} className="inline">
            <span
              onMouseEnter={() => onHover?.(baseIndex)}
              onMouseLeave={() => onHover?.(null)}
              onClick={(e) => handleClick(baseIndex, e)}
              className={`inline-block rounded cursor-pointer transition-colors duration-75 ${
                isHighlighted ? highlightClassName : ""
              }`}
            >
              <span className={`inline-block ${isBlurred ? "blur-sm" : "blur-none"}`}>
                {c.text}
              </span>
            </span>

            <span aria-hidden className="select-none whitespace-pre-wrap">
              {renderSpace(c.afterSpace)}
            </span>
          </span>
        );
      })}
    </p>
  )
}
