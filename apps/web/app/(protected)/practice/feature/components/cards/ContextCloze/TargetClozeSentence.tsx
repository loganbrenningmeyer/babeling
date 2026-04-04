import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import type { GlossaryContextTokenSlice } from "@/app/(protected)/documents/feature/types/glossaryItem";

const FILLED_CHOICE_CLASS_NAME =
  "absolute left-0 right-0 top-1/2 z-10 inline-flex h-7 w-full -translate-y-1/2 items-center justify-center rounded-full border border-foreground/30 bg-card px-4 py-2 leading-none text-lg font-ui";

const EMPTY_BLANK_CLASS_NAME =
  "absolute left-0 right-0 top-1/2 h-7 w-full -translate-y-1/2 rounded-full bg-muted";

const BLANK_SLOT_CLASS_NAME =
  "relative inline-block align-baseline mx-0.5";

const BLANK_SLOT_SIZER_CLASS_NAME =
  "invisible inline-block px-4 leading-[inherit] text-lg font-ui";

const CHOICE_TRANSITION = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
};


/**************************
 * `TargetClozeSentence()`
 * -- Renders target sentence with words blanked out
 **************************/
export function TargetClozeSentence({
  slice,
  choices,
  choiceWidthsPx,
  blankWordIds,
  filledChoiceIndexByWordId,
  correctnessByWordId,
  gradingReady,
  onFilledChoiceClick,
  blankWidth,
  className,
}: {
  slice: GlossaryContextTokenSlice;
  choices: string[];
  choiceWidthsPx: number[];
  blankWordIds: number[];
  filledChoiceIndexByWordId: Record<number, number>;
  correctnessByWordId: Record<number, boolean>;
  gradingReady: boolean;
  onFilledChoiceClick: (wordId: number) => void;
  blankWidth: number;
  className?: string;
}) {
  // -------------------------
  // Track which local word ids are blanked
  // -------------------------
  const blankSet = new Set(blankWordIds);

  return (
    <p className={cn("whitespace-pre-wrap leading-6", className)}>
      {slice.words.map((word, i) => {
        // -------------------------
        // Resolve blank state for each token
        // -------------------------
        const isBlank = blankSet.has(i);
        const filledChoiceIndex = filledChoiceIndexByWordId[i];
        const filledWord =
          filledChoiceIndex == null ? null : choices[filledChoiceIndex] ?? null;
        const isCorrect = correctnessByWordId[i];
        const slotWidth =
          filledChoiceIndex == null
            ? blankWidth
            : choiceWidthsPx[filledChoiceIndex] ?? blankWidth;

        // -------------------------
        // Preserve original sentence spacing
        // -------------------------
        const rawSpace = slice.spaces[i] ?? "";
        const space =
          i === slice.words.length - 1
            ? rawSpace.replace(/\s+$/, "")
            : rawSpace;
        const renderedSpace = isBlank && space === "" ? " " : space;

        return (
          <span key={i}>
            {isBlank ? (
              <span
                className={BLANK_SLOT_CLASS_NAME}
                style={{ width: slotWidth }}
              >
                {/* -------------------------
                //* Keep the muted blank visible
                //* while letting text reflow
                //* only once at the final width
                //* ------------------------- */}
                <span
                  aria-hidden="true"
                  className={BLANK_SLOT_SIZER_CLASS_NAME}
                >
                  {filledWord ?? "blank"}
                </span>

                <span
                  aria-hidden="true"
                  className={EMPTY_BLANK_CLASS_NAME}
                />

                {filledWord ? (
                  <motion.button
                    type="button"
                    layoutId={`context-cloze-choice-${filledChoiceIndex}`}
                    transition={CHOICE_TRANSITION}
                    onClick={() => onFilledChoiceClick(i)}
                    className={cn(
                      FILLED_CHOICE_CLASS_NAME,
                      "transition-colors duration-300",
                      gradingReady &&
                        (isCorrect
                          ? "border-emerald-500"
                          : "border-rose-500")
                    )}
                  >
                    {filledWord}
                  </motion.button>
                ) : null}
              </span>
            ) : (
              word
            )}
            {renderedSpace}
          </span>
        );
      })}
    </p>
  );
}
