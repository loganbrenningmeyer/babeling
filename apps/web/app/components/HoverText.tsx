import { useEffect, useState } from "react";
import { BlurMode } from "./BlurModeToggle";

type IdToWords = Record<number, number[]>;

type BlurConfig = {
  mode: BlurMode;
  sentIds: number[];
  parIds: number[];
  sentIdToWords: IdToWords;
  parIdToWords: IdToWords;
}

type HoverTextProps = {
  words: string[];
  spaces: string[];
  highlightIndices?: number[];
  variant: "source" | "target"
  onHover?: (index: number | null) => void;
  onWordClick?: (index: number) => void;
  blur?: BlurConfig;
};

export function HoverText({
  words,
  spaces,
  highlightIndices = [],
  variant,
  onHover,
  onWordClick,
  blur
}: HoverTextProps) {
  // Define source / target highlight colors
  const highlightColor =
    variant === "source"
      ? "bg-blue-500/20 hover:bg-blue-500/30"
      : "bg-orange-500/20 hover:bg-orange-500/30";

  // Toggle blur/unblur (initially all blurred source)
  const [blurred, setBlurred] = useState<Set<number>>(
    () => (blur ? new Set(words.map((_, i) => i)) : new Set())
  );

  useEffect(() => {
    if (!blur) return;
    // Reblur everything when blurMode changes
    setBlurred(new Set(words.map((_, i) => i)))
  }, [blur?.mode, blur ? words : null]);

  const toggleBlur = (i: number) => {
    // Do not blur target text
    if (!blur) return;

    setBlurred(prev => {
      const next = new Set(prev);
      // Word blur
      if (blur.mode === "word") {
        next.has(i) ? next.delete(i) : next.add(i);
        return next;
      }

      // Sentence blur
      if (blur.mode === "sentence") {
        const sentId = blur.sentIds[i];
        const idxs = blur.sentIdToWords[sentId];
        for (const j of idxs) {
          next.has(j) ? next.delete(j) : next.add(j);
        }
        return next;
      }

      // Paragraph blur
      if (blur.mode === "paragraph") {
        const parId = blur.parIds[i];
        const idxs = blur.parIdToWords[parId];
        for (const j of idxs) {
          next.has(j) ? next.delete(j) : next.add(j);
        }
        return next;
      }

      return next;
    });
  };

  const handleClick = (i: number) => {
    // If blur is enabled, click toggles blur
    if (blur) toggleBlur(i);
    // Otherwise, use click handler
    onWordClick?.(i);
  };

  return (
    <p className="min-h-[40vh] flex-wrap items-baseline p-4 text-base leading-6 font-sans shadow">
      {words.map((word, i) => {
        const isHighlighted = highlightIndices.includes(i);
        const isBlurred = blur ? blurred.has(i) : false;

        return (
          <span key={i} className="inline">
            {/* Background highlight */}
            <span
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => handleClick(i)}
              className={`inline-block rounded cursor-pointer transition-colors duration-150
                ${isHighlighted ? highlightColor : ""}
              `}
            >
              {/* Text blur */}
              <span className={`inline-block ${isBlurred ? "blur-sm" : "blur-none"}`}>
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