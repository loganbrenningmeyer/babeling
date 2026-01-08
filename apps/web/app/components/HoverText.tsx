type HoverTextProps = {
  // words: Word-tokenized text
  words: string[];
  spaces: string[];
  // Word indices that should be highlighted currently
  highlightIndices?: number[];
  // Callback to parent saying which word index is being hovered currently
  // Calls setHoveredSourceIndex(index) in parent when called
  onHover?: (index: number | null) => void;
};

export function HoverText({
  words,
  spaces,
  highlightIndices = [],
  onHover,
}: HoverTextProps) {
  return (
    <p className="flex-wrap items-baseline text-sm leading-6 font-sans p-0">
      {words.map((word, i) => {
        const isHighlighted = highlightIndices.includes(i);

        return (
          <span key={i} className="inline">
            {/* Word */}
            <span
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              className={`inline rounded transition hover:bg-blue-500/20 ${
                isHighlighted ? "bg-blue-500/20" : ""
              }`}
            >
              {word}
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