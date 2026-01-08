type HoverTextProps = {
  // words: Word-tokenized text
  words: string[];
  spaces: string[];
  // Word indices that should be highlighted currently
  highlightIndices?: number[];
  // Callback to parent saying which word index is being hovered currently
  // Calls setHoveredSourceIndex(index) in parent when called
  onHover?: (index: number | null) => void;
  // Control highlight color for source (blue) / target (orange)
  textType?: "source" | "target"
};

export function HoverText({
  words,
  spaces,
  highlightIndices = [],
  onHover,
  textType,
}: HoverTextProps) {

  const highlightColor =
    textType === "source"
      ? "bg-blue-500/20 hover:bg-blue-500/30"
      : "bg-orange-500/20 hover:bg-orange-500/30";

  return (
    <p className="
        min-h-[40vh] 
        flex-wrap items-baseline p-0 
        text-sm leading-6 font-sans
    ">
      {words.map((word, i) => {
        const isHighlighted = highlightIndices.includes(i);

        return (
          <span key={i} className="inline">
            {/* Word */}
            <span
              onMouseEnter={() => onHover?.(i)}
              onMouseLeave={() => onHover?.(null)}
              className={`inline rounded transition ${
                isHighlighted ? highlightColor : ""
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