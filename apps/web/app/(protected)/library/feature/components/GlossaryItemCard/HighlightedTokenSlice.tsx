import { cn } from "@/lib/utils";

import type { GlossaryContextTokenSlice } from "@/app/(protected)/documents/feature/types/glossaryItem";


export function HighlightedTokenSlice({
  slice,
  className,
  highlightClassName = "bg-yellow-200/70",
}: {
  slice: GlossaryContextTokenSlice;
  className?: string;
  highlightClassName?: string;
}) {
  const highlighted = new Set(slice.highlightedLocalWordIds);

  return (
    <p className={cn("whitespace-pre-wrap leading-6", className)}>
      {slice.words.map((word, i) => {
        const isHighlighted = highlighted.has(i);
        const rawSpace = slice.spaces[i] ?? "";
        const space =
          i === slice.words.length - 1
            ? rawSpace.replace(/\s+$/, "")  // trim trailing whitespace
            : rawSpace;

        return (
          <span key={`${slice.globalWordIds[i] ?? i}-${i}`}>
            <span
              className={cn(
                isHighlighted &&
                  `${highlightClassName} rounded px-0.5 text-foreground font-semibold`
              )}
            >
              {word}
            </span>
            {space}
          </span>
        );
      })}
    </p>
  );
}