import { useEffect, useState } from "react";

import { BlurMode } from "./BlurModeToggle";

type IdToWords = Record<number, number[]>;

type HoverTextProps = {
  // words: Word-tokenized text
  words: string[];
  // spaces: trailing whitespace per word
  spaces: string[];
  // sentence / paragraph id mappings
  sentIds?: number[];
  parIds?: number[];
  sentIdToWords?: IdToWords;
  parIdToWords?: IdToWords;
  // Word indices that should be highlighted currently
  highlightIndices?: number[];
  // Callback to parent saying which word index is being hovered currently
  // Calls setHoveredSourceIndex(index) in parent when called
  onHover?: (index: number | null) => void;
  // Control highlight color for source (blue) / target (orange)
  textType?: "source" | "target"
  // Blur by word / sentence / paragraph
  blurMode: BlurMode;
};

export function HoverText({
  words,
  spaces,
  sentIds,
  parIds,
  sentIdToWords,
  parIdToWords,
  highlightIndices = [],
  onHover,
  textType,
  blurMode
}: HoverTextProps) {

  const isSource = textType === "source";

  // Toggle blur/unblur (initially all blurred)
  const [blurred, setBlurred] = useState<Set<number>>(
    () => (isSource ? new Set(words.map((_, i) => i)) : new Set())
  );

  useEffect(() => {
    if (!isSource) return;
    // Reblur everything when blurMode changes
    setBlurred(new Set(words.map((_, i) => i)))
  }, [blurMode, isSource, words]);

  const toggleBlur = (i: number) => {
    // Do not blur target text
    if (!isSource) return;

    setBlurred(prev => {
      const next = new Set(prev);
      // Word blur
      if (blurMode === "word") {
        next.has(i) ? next.delete(i) : next.add(i);
      }

      // Sentence blur
      else if (blurMode === "sentence") {
        if (!sentIds || !sentIdToWords) return next;
        const word_idxs = sentIdToWords[sentIds[i]];
        
        for (const j of word_idxs) {
          next.has(j) ? next.delete(j) : next.add(j);
        }
      }

      // Paragraph blur
      else if (blurMode === "paragraph") {
        if (!parIds || !parIdToWords) return next;
        const word_idxs = parIdToWords[parIds[i]];

        for (const j of word_idxs) {
          next.has(j) ? next.delete(j) : next.add(j);
        }
      }

      return next;
    });
  }

  // Define source / target highlight colors
  const highlightColor =
    isSource
      ? "bg-blue-500/20 hover:bg-blue-500/30"
      : "bg-orange-500/20 hover:bg-orange-500/30";

  return (
    <p className="
        min-h-[40vh] 
        flex-wrap items-baseline p-4 
        text-base leading-6 font-sans
        shadow
    ">
      {words.map((word, i) => {
        const isHighlighted = highlightIndices.includes(i);
        const isBlurred = blurred.has(i);

        return (
          <span key={i} className="inline">
            {/* Background highlight */}
            <span
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => toggleBlur(i)}
              className={`inline-block rounded cursor-pointer
                transition-colors duration-150
                ${isHighlighted ? highlightColor : ""}
              `}
            >
              {/* Text blur */}
              <span
                className={`inline-block
                  ${isBlurred ? "blur-sm" : "blur-none"}
                `}
              >
                {word}
              </span>
            </span>

            {/* Space (not interactive, not highlighted) */}
            <span aria-hidden className="select-none">
                {spaces[i]}
            </span>
          </span>
        );
      })}
    </p>
  );
}