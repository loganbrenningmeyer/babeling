type HoverTextProps = {
  // words: Word-tokenized text
  words: string[];
  // Word indices that should be highlighted currently
  highlightIndices?: number[];
  // Callback to parent saying which word index is being hovered currently
  // Calls setHoveredSourceIndex(index) in parent when called
  onHover?: (index: number | null) => void;
};

export function HoverText({
  words,
  highlightIndices = [],
  onHover,
}: HoverTextProps) {
  return (
    <p className="flex flex-wrap leading-relaxed">
      {/* Return span for each word in word list */}
      {words.map((word, i) => {
        // For word (i), true if parent says to highlight (i)
        const isHighlighted = highlightIndices.includes(i);

        return (
          <span
            key={i}
            // setHoveredSourceIndex(i)
            onMouseEnter={() => onHover?.(i)}
            // setHoveredSourceIndex(null)
            onMouseLeave={() => onHover?.(null)}
            // Highlight when hovered or isHighlighted is true
            className={`rounded px-0.5 py-0.5 transition hover:bg-blue-500/20
              ${isHighlighted ? "bg-blue-500/20" : ""}
            `}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}