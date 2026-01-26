import React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { BlurMode } from "./BlurModeToggle";

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

  // -------------------------
  // Non-breaking space w/ adjacent punctuation
  // -------------------------
  const LEADING_PUNCT = new Set([
    '"', "'", "“", "‘", "«",
    "(", "[", "{",
  ]);

  const TRAILING_PUNCT = new Set([
    ",", ".", ";", ":", "!", "?", "…",
    '"', "'", "”", "’", "»",
    ")", "]", "}", "%",
  ]);

  const isInlineSpace = (s: string) => /^[^\S\n]+$/.test(s);

  function shouldClingPrev(prevToken: string | undefined, space: string) {
    if (!prevToken) return false;
    if (!LEADING_PUNCT.has(prevToken)) return false;

    return space === "" || isInlineSpace(space);
  }

  function shouldClingNext(nextToken: string | undefined, space: string) {
    if (!nextToken) return false;
    if (!TRAILING_PUNCT.has(nextToken)) return false;

    // True if no whitespace or only inline whitespace
    return space === "" || isInlineSpace(space);
  }

  function normalizeSpaceForPunct(nextToken: string | undefined, space: string) {
    if (!nextToken) return space;
    if (!TRAILING_PUNCT.has(nextToken)) return space;

    // If it's only inline whitespace (no newlines), make it non-breaking.
    if (isInlineSpace(space)) {
      // Replace regular spaces with NBSP, and also replace narrow NBSP with NBSP
      return space
        .replace(/ /g, "\u00A0")
        .replace(/\u202F/g, "\u00A0");
    }
    return space;
  }

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

  // -------------------------
  // Build spans for each word/punctuation cluster
  // -------------------------
  const hoverWords: React.ReactNode[] = [];
  let i = 0;

  while (i < words.length) {
    let start = i;
    let end = i;

    let clusterText = words[i] ?? "";

    // If current token is an opening punct, glue it to the next token (if same line)
    if (
      LEADING_PUNCT.has(words[i] ?? "") &&
      (spaces[i] === "" || isInlineSpace(spaces[i] ?? "")) &&
      words[i + 1] !== undefined
    ) {
      const nextToken = words[i + 1]!;
      const glue = spaces[i] ?? ""; // typically "" after an opening quote
      clusterText += glue + nextToken;
      end = i + 1;
    }

    // Now glue trailing punctuation after `end`
    while (shouldClingNext(words[end + 1], spaces[end] ?? "")) {
      const nextToken = words[end + 1] ?? "";
      const space = spaces[end] ?? "";
      clusterText += normalizeSpaceForPunct(nextToken, space) + nextToken;
      end += 1;
    }

    // Choose which token index should “own” this cluster for hover/highlight/blur.
    // If we started on an opener and glued a word, use the word's index.
    const anchorLocalIndex =
      LEADING_PUNCT.has(words[start] ?? "") && end > start ? start + 1 : start;

    const baseIndex = anchorLocalIndex + indexOffset;

    const isHighlighted = highlightIndices.includes(baseIndex);
    const isBlurred = blur ? blurred.has(baseIndex) : false;

    hoverWords.push(
      <span key={baseIndex} className="inline">
        {/* Background highlight */}
        <span
          onMouseEnter={() => onHover?.(baseIndex)}
          onMouseLeave={() => onHover?.(null)}
          onClick={(e) => handleClick(baseIndex, e)}
          className={`inline-block rounded cursor-pointer transition-colors duration-150
            ${isHighlighted ? highlightColor : ""}
          `}
        >
          {/* Text blur */}
          <span className={`inline-block ${isBlurred ? "blur-sm" : "blur-none"}`}>
            {clusterText}
          </span>
        </span>

        {/* Space after cluster */}
        <span aria-hidden className="select-none whitespace-pre-wrap">
          {renderSpace(normalizeSpaceForPunct(words[end + 1], spaces[end] ?? ""))}
        </span>
      </span>
    );

    i = end + 1;    // Advance past the cluster
  }

  return <p className={cn("whitespace-pre-wrap", disabled ? "pointer-events-none" : "", className)}>{hoverWords}</p>;
}
