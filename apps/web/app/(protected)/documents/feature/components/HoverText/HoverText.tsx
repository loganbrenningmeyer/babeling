import React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { BlurMode } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import { buildClusters } from "./clusterText";

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
  variant: "source" | "target";
  onHover?: (index: number | null) => void;
  onWordClick?: (index: number, el: HTMLElement) => void;
  blur?: BlurConfig;
  disabled?: boolean;
  className?: string;
};

export function HoverText({
  words,
  spaces,
  indexOffset = 0,
  highlightIndices = [],
  variant,
  onHover,
  onWordClick,
  blur,
  disabled,
  className,
}: HoverTextProps) {
  // Define source / target highlight colors
  const highlightColor =
    variant === "source"
      ? "bg-blue-500/20 hover:bg-blue-500/30"
      : "bg-orange-500/20 hover:bg-orange-500/30";

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
        wordIsBlurred ? next.delete(i) : next.add(i);
        return next;
      }

      // Sentence blur
      if (blur.mode === "sentence") {
        const sentId = blur.sentIds[i];
        const idxs = blur.sentToWordIds[sentId];
        for (const j of idxs) {
          // Toggle sentence with clicked word
          if (next.has(j) === wordIsBlurred) {
            next.has(j) ? next.delete(j) : next.add(j);
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
            next.has(j) ? next.delete(j) : next.add(j);
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

  const clusters = buildClusters(words, spaces)

  return (
    <p 
      className={cn(
        "whitespace-pre-wrap font-reading", 
        disabled ? "pointer-events-none" : "",
        "select-none",
        className
      )}
    >
    {clusters.map((c) => {
      const baseIndex = c.anchorLocalIndex + indexOffset;
      const isHighlighted = highlightIndices.includes(baseIndex);
      const isBlurred = blur ? blurred.has(baseIndex) : false;

      return (
        <span key={baseIndex} className="inline">
          <span
            onMouseEnter={() => onHover?.(baseIndex)}
            onMouseLeave={() => onHover?.(null)}
            onClick={(e) => handleClick(baseIndex, e)}
            className={`inline-block rounded cursor-pointer transition-colors duration-150 ${
              isHighlighted ? highlightColor : ""
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
