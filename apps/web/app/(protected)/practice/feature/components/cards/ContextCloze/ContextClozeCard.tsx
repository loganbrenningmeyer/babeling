"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { LayoutGroup, motion, useAnimationControls } from "framer-motion";

import { LangBadge } from "@/app/components/LangBadge";
import { useMessages } from "@/app/hooks/useMessages";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { TargetClozeSentence } from "./TargetClozeSentence";

import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import type { GlossaryContextTokenSlice } from "@/app/(protected)/documents/feature/types/glossaryItem";
import { GlossaryInfoOverlay } from "../GlossaryInfoOverlay";

const srcFontSize = "text-md";
const tgtFontSize = "text-lg";

const CHOICE_BUTTON_CLASS_NAME =
  `col-start-1 row-start-1 inline-flex h-7 w-full cursor-pointer items-center justify-center rounded-full border border-border bg-card px-4 py-2 leading-none transition-colors hover:border-foreground/30 hover:bg-muted/15 ${tgtFontSize} font-ui`;

const CHOICE_PLACEHOLDER_CLASS_NAME =
  "col-start-1 row-start-1 inline-flex h-7 w-full items-center justify-center rounded-full bg-muted/70 px-4 py-2 text-sm font-ui text-transparent select-none";

const CHOICE_SLOT_CLASS_NAME =
  "relative inline-grid";

const CHOICE_SLOT_SIZER_CLASS_NAME =
  "col-start-1 row-start-1 inline-flex h-7 items-center justify-center rounded-full border px-4 py-2 leading-none text-sm font-ui invisible select-none";

const CHOICE_TRANSITION = {
  type: "spring" as const,
  stiffness: 500,
  damping: 35,
};

const GRADE_REVEAL_DELAY_MS = 500;
const INCORRECT_RETURN_DELAY_MS = 500;
const MAX_SOURCE_CONTEXT_WORDS = 24;
const MAX_TARGET_CONTEXT_WORDS = 18;
const SUCCESS_CARD_CLASS_NAME =
  "border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.18)]";


function isPunctuationToken(token: string): boolean {
  return token.length > 0 && /^[\p{P}]+$/u.test(token);
}

function getClosestWordPosition(wordIds: number[], targetWordId: number): number {
  let closestPosition = 0;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < wordIds.length; i += 1) {
    const distance = Math.abs(wordIds[i] - targetWordId);

    if (distance < smallestDistance) {
      closestPosition = i;
      smallestDistance = distance;
    }
  }

  return closestPosition;
}

/**************************
 * `getBlankWordIds()`
 * -- Gets the target word IDs to blank,
 * skipping punctuation-only tokens while
 * staying centered around the highlighted word.
 **************************/
function getBlankWordIds(
  words: string[],
  tgtIdx: number,
  numBlank: number,
): number[] {
  if (words.length === 0) return [];

  const blankableWordIds = words.flatMap((word, index) =>
    isPunctuationToken(word) ? [] : [index]
  );

  if (blankableWordIds.length === 0) {
    return [Math.max(0, Math.min(tgtIdx, words.length - 1))];
  }

  const windowSize = Math.min(numBlank, blankableWordIds.length);
  const highlightedWordPosition = blankableWordIds.indexOf(tgtIdx);
  const focusPosition =
    highlightedWordPosition >= 0
      ? highlightedWordPosition
      : getClosestWordPosition(blankableWordIds, tgtIdx);

  const start = Math.max(
    0,
    Math.min(
      focusPosition - Math.floor((windowSize - 1) / 2),
      blankableWordIds.length - windowSize
    )
  );

  return blankableWordIds.slice(start, start + windowSize);
}


/**************************
 * `getShuffledChoiceIndices()`
 * -- Shuffle the display order of
 * the bank without changing the
 * logical answer ordering.
 **************************/
function getShuffledChoiceIndices(
  numChoices: number,
  seed: number,
): number[] {
  const indices = Array.from({ length: numChoices }, (_, i) => i);
  let state = seed || 1;

  function nextRandom() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  }

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}


/**************************
 * `getTokenWindow()`
 * -- Return a stable token window that
 * always contains the focus span while
 * trimming context on both sides.
 **************************/
function getTokenWindow(args: {
  numWords: number;
  focusStart: number;
  focusEnd: number;
  maxWords: number;
}): {
  start: number;
  end: number;
} {
  const { numWords, focusStart, focusEnd, maxWords } = args;

  if (numWords <= maxWords) {
    return { start: 0, end: numWords };
  }

  const focusWidth = Math.max(1, focusEnd - focusStart + 1);
  const clippedFocusWidth = Math.min(focusWidth, maxWords);
  const remaining = maxWords - clippedFocusWidth;
  const before = Math.floor(remaining / 2);
  const after = remaining - before;

  let start = Math.max(0, focusStart - before);
  let end = Math.min(numWords, focusEnd + 1 + after);

  const windowSize = end - start;
  if (windowSize < maxWords) {
    if (start === 0) {
      end = Math.min(numWords, start + maxWords);
    } else if (end === numWords) {
      start = Math.max(0, end - maxWords);
    }
  }

  return { start, end };
}


/**************************
 * `truncateTokenSlice()`
 * -- Trim a token slice around a focus
 * region and add ellipsis tokens when
 * context is omitted from either side.
 **************************/
function truncateTokenSlice(args: {
  slice: GlossaryContextTokenSlice;
  focusStart: number;
  focusEnd: number;
  maxWords: number;
}): {
  slice: GlossaryContextTokenSlice;
  windowStart: number;
  prefixTokenCount: number;
} {
  const { slice, focusStart, focusEnd, maxWords } = args;

  if (slice.words.length === 0) {
    return {
      slice,
      windowStart: 0,
      prefixTokenCount: 0,
    };
  }

  const { start, end } = getTokenWindow({
    numWords: slice.words.length,
    focusStart,
    focusEnd,
    maxWords,
  });

  const words = slice.words.slice(start, end);
  const spaces = slice.spaces.slice(start, end);
  const globalWordIds = slice.globalWordIds.slice(start, end);
  const highlightedLocalWordIds = slice.highlightedLocalWordIds
    .filter((wordId) => wordId >= start && wordId < end)
    .map((wordId) => wordId - start);

  let prefixTokenCount = 0;

  if (start > 0) {
    words.unshift("…");
    spaces.unshift(" ");
    globalWordIds.unshift(-1);
    prefixTokenCount = 1;

    for (let i = 0; i < highlightedLocalWordIds.length; i += 1) {
      highlightedLocalWordIds[i] += 1;
    }
  }

  if (end < slice.words.length) {
    words.push("…");
    spaces.push("");
    globalWordIds.push(-1);
  }

  return {
    slice: {
      words,
      spaces,
      globalWordIds,
      highlightedLocalWordIds,
    },
    windowStart: start,
    prefixTokenCount,
  };
}


/**************************
 * `ContextClozeCard()`
 * -- Given a source/target sentence pair with target words missing,
 * put the target words into the sentence in order
 **************************/
export function ContextClozeCard({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const m = useMessages();
  const layoutGroupId = useId();
  const shakeControls = useAnimationControls();

  // -------------------------
  // Resolve target sentence state
  // -------------------------
  const srcSlice = glossaryItem.definition.contextAlignment.sentence.src;
  const tgtSlice = glossaryItem.definition.contextAlignment.sentence.tgt;
  const tgtIdx = tgtSlice.highlightedLocalWordIds[0];
  const numBlank = 3;

  // -------------------------
  // Choose which words become blanks
  // -------------------------
  const blankWordIds = useMemo(
    () => getBlankWordIds(tgtSlice.words, tgtIdx, numBlank),
    [tgtSlice.words, tgtIdx, numBlank]
  );

  // -------------------------
  // Build choice bank from the hidden words
  // -------------------------
  const choices = useMemo(
    () => blankWordIds.map((wordId) => tgtSlice.words[wordId]),
    [blankWordIds, tgtSlice.words]
  );

  /**************************
   * Truncate sentence context
   * --
   * Keep the target view centered on
   * the blank span. For the source
   * view, prefer aligned source tokens
   * and fall back to the projected
   * target position when alignment is
   * missing.
   **************************/
  const truncatedTarget = useMemo(() => {
    const focusStart = Math.min(...blankWordIds);
    const focusEnd = Math.max(...blankWordIds);

    return truncateTokenSlice({
      slice: tgtSlice,
      focusStart,
      focusEnd,
      maxWords: MAX_TARGET_CONTEXT_WORDS,
    });
  }, [blankWordIds, tgtSlice]);

  const truncatedBlankWordIds = useMemo(
    () =>
      blankWordIds.map(
        (wordId) => wordId - truncatedTarget.windowStart + truncatedTarget.prefixTokenCount
      ),
    [blankWordIds, truncatedTarget.prefixTokenCount, truncatedTarget.windowStart]
  );

  const truncatedSourceSlice = useMemo(() => {
    if (srcSlice.words.length === 0) return srcSlice;

    const srcHighlights = srcSlice.highlightedLocalWordIds;
    const tgtFocusStart = Math.min(...blankWordIds);
    const tgtFocusEnd = Math.max(...blankWordIds);
    const tgtFocusCenter = (tgtFocusStart + tgtFocusEnd) / 2;
    const tgtRatio =
      tgtSlice.words.length <= 1 ? 0 : tgtFocusCenter / (tgtSlice.words.length - 1);
    const projectedSrcCenter = Math.round(
      tgtRatio * Math.max(srcSlice.words.length - 1, 0)
    );

    const focusStart =
      srcHighlights.length > 0 ? Math.min(...srcHighlights) : projectedSrcCenter;
    const focusEnd =
      srcHighlights.length > 0 ? Math.max(...srcHighlights) : projectedSrcCenter;

    return truncateTokenSlice({
      slice: srcSlice,
      focusStart,
      focusEnd,
      maxWords: MAX_SOURCE_CONTEXT_WORDS,
    }).slice;
  }, [blankWordIds, srcSlice, tgtSlice.words.length]);

  // -------------------------
  // Shuffle visual choice order
  // -------------------------
  const shuffledChoiceIndices = useMemo(
    () => getShuffledChoiceIndices(choices.length, glossaryItem.glossaryItemId),
    [choices.length, glossaryItem.glossaryItemId]
  );

  /**************************
   * Fixed blank width
   * --
   * Empty blanks stay at a stable width
   * until a real choice button is placed.
   **************************/
  const blankWidthPx = 48;

  /**************************
   * Measure choice slot widths
   * --
   * Use the original choice-bank slot
   * widths so sentence blanks can grow
   * to match the selected button size.
   **************************/
  const choiceSlotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [choiceWidthsPx, setChoiceWidthsPx] = useState<number[]>([]);

  useLayoutEffect(() => {
    setChoiceWidthsPx(
      choices.map((_, i) => {
        const el = choiceSlotRefs.current[i];
        return el?.getBoundingClientRect().width ?? 0;
      })
    );
  }, [choices]);

  /**************************
   * Track filled blanks
   * --
   * Maps each blank word id to the
   * selected choice index currently
   * occupying that blank.
   **************************/
  const [filledChoiceIndexByWordId, setFilledChoiceIndexByWordId] = useState<
    Record<number, number>
  >({});

  // -------------------------
  // Derive which choice buttons are in use
  // -------------------------
  const usedChoices = useMemo(
    () => new Set(Object.values(filledChoiceIndexByWordId)),
    [filledChoiceIndexByWordId]
  );

  /**************************
   * Resolve filled words
   * --
   * Grade against the actual filled
   * word string, not the button's
   * original index, so duplicate
   * answers remain interchangeable.
   **************************/
  const filledWordByWordId = useMemo(
    () =>
      Object.fromEntries(
        blankWordIds.map((wordId) => [
          wordId,
          filledChoiceIndexByWordId[wordId] == null
            ? null
            : choices[filledChoiceIndexByWordId[wordId]] ?? null,
        ])
      ) as Record<number, string | null>,
    [blankWordIds, choices, filledChoiceIndexByWordId]
  );

  // -------------------------
  // Track completion state
  // -------------------------
  const allFilled = useMemo(
    () => blankWordIds.every((wordId) => filledChoiceIndexByWordId[wordId] != null),
    [blankWordIds, filledChoiceIndexByWordId]
  );

  /**************************
   * Delay grading reveal
   * --
   * Wait briefly after the final fill
   * before showing correct/incorrect
   * border states.
   **************************/
  const [gradingReady, setGradingReady] = useState(false);

  useEffect(() => {
    if (!allFilled) {
      setGradingReady(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setGradingReady(true);
    }, GRADE_REVEAL_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [allFilled]);

  /**************************
   * Return incorrect answers
   * --
   * After grading appears, move only
   * incorrect choices back to their
   * original bank slots.
   **************************/
  useEffect(() => {
    if (!allFilled || !gradingReady) return;

    const incorrectWordIds = blankWordIds.filter(
      (wordId) => filledWordByWordId[wordId] !== tgtSlice.words[wordId]
    );

    if (incorrectWordIds.length === 0) return;

    void shakeControls.start({
      x: [0, -5, 5, -4, 4, 0],
      transition: {
        duration: 0.28,
        ease: "easeInOut",
      },
    });

    const timeoutId = window.setTimeout(() => {
      setFilledChoiceIndexByWordId((prev) => {
        const next = { ...prev };

        incorrectWordIds.forEach((wordId) => {
          const filledWord =
            next[wordId] == null ? null : choices[next[wordId]] ?? null;

          if (filledWord !== tgtSlice.words[wordId]) {
            delete next[wordId];
          }
        });

        return next;
      });
    }, INCORRECT_RETURN_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    allFilled,
    blankWordIds,
    choices,
    filledWordByWordId,
    gradingReady,
    shakeControls,
    tgtSlice.words,
  ]);

  /**************************
   * Derive correctness state
   * --
   * Compare each filled word string
   * against the target word at that
   * blank position.
   **************************/
  const correctnessByWordId = useMemo(
    () =>
      Object.fromEntries(
        blankWordIds.map((wordId) => [
          wordId,
          filledWordByWordId[wordId] === tgtSlice.words[wordId],
        ])
      ) as Record<number, boolean>,
    [blankWordIds, filledWordByWordId, tgtSlice.words]
  );

  const isCorrect =
    gradingReady && blankWordIds.every((wordId) => correctnessByWordId[wordId]);

  // -------------------------
  // Remap visible target state
  // -------------------------
  const visibleFilledChoiceIndexByWordId = useMemo(
    () =>
      Object.fromEntries(
        blankWordIds
          .filter((wordId) => filledChoiceIndexByWordId[wordId] != null)
          .map((wordId) => [
            wordId - truncatedTarget.windowStart + truncatedTarget.prefixTokenCount,
            filledChoiceIndexByWordId[wordId],
          ])
      ) as Record<number, number>,
    [blankWordIds, filledChoiceIndexByWordId, truncatedTarget.prefixTokenCount, truncatedTarget.windowStart]
  );

  const visibleCorrectnessByWordId = useMemo(
    () =>
      Object.fromEntries(
        blankWordIds.map((wordId) => [
          wordId - truncatedTarget.windowStart + truncatedTarget.prefixTokenCount,
          correctnessByWordId[wordId],
        ])
      ) as Record<number, boolean>,
    [blankWordIds, correctnessByWordId, truncatedTarget.prefixTokenCount, truncatedTarget.windowStart]
  );

  const originalBlankWordIdByVisibleWordId = useMemo(
    () =>
      Object.fromEntries(
        blankWordIds.map((wordId) => [
          wordId - truncatedTarget.windowStart + truncatedTarget.prefixTokenCount,
          wordId,
        ])
      ) as Record<number, number>,
    [blankWordIds, truncatedTarget.prefixTokenCount, truncatedTarget.windowStart]
  );

  /**************************
   * `handleChoiceClick()`
   * --
   * Place the clicked choice into the
   * next available blank from left to right.
   **************************/
  function handleChoiceClick(choiceIndex: number) {
    if (usedChoices.has(choiceIndex)) return;

    const nextBlankWordId = blankWordIds.find(
      (wordId) => filledChoiceIndexByWordId[wordId] == null
    );

    if (nextBlankWordId == null) return;

    setFilledChoiceIndexByWordId((prev) => ({
      ...prev,
      [nextBlankWordId]: choiceIndex,
    }));
  }

  /**************************
   * `handleFilledChoiceClick()`
   * --
   * Remove a placed choice from its blank
   * so the source button becomes available again.
   **************************/
  function handleFilledChoiceClick(wordId: number) {
    setFilledChoiceIndexByWordId((prev) => {
      if (prev[wordId] == null) return prev;

      const next = { ...prev };
      delete next[wordId];
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-xl text-left">
      <div className="aspect-[4/3] w-full">
        <Card
          className={cn(
            `
              relative h-full w-full rounded-xl border bg-card p-5 shadow-sm
              transition-[border-color,box-shadow] duration-300 ease-out
            `,
            isCorrect && SUCCESS_CARD_CLASS_NAME
          )}
        >
          <CardContent className="h-full p-0">
            <LayoutGroup id={layoutGroupId}>
              <div className="flex h-full flex-col gap-4">

                {/* -------------------------
                //* Source Sentence
                //* ------------------------- */}
                <div className={`${srcFontSize} p-3 font-ui text-muted-foreground`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LangBadge
                        lang={glossaryItem.srcLang}
                        labels={m.langs}
                        useLabel={true}
                      />
                    </div>
                  </div>
                  <p
                    className={`${srcFontSize} whitespace-pre-wrap leading-7 text-muted-foreground`}
                  >
                    {truncatedSourceSlice.words.map((word, i) => {
                      const rawSpace = truncatedSourceSlice.spaces[i] ?? "";
                      const space =
                        i === truncatedSourceSlice.words.length - 1
                          ? rawSpace.replace(/\s+$/, "")
                          : rawSpace;

                      return (
                        <span
                          key={`${truncatedSourceSlice.globalWordIds[i] ?? i}-${i}`}
                        >
                          {word}
                          {space}
                        </span>
                      );
                    })}
                  </p>
                </div>

                {/* -------------------------
                //* Target Sentence
                //* ------------------------- */}
                <motion.div
                  animate={shakeControls}
                  className="border bg-muted/30 p-3"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LangBadge
                        lang={glossaryItem.tgtLang}
                        labels={m.langs}
                        useLabel={true}
                      />
                    </div>
                  </div>
                  <TargetClozeSentence
                    slice={truncatedTarget.slice}
                    choices={choices}
                    choiceWidthsPx={choiceWidthsPx}
                    blankWordIds={truncatedBlankWordIds}
                    filledChoiceIndexByWordId={visibleFilledChoiceIndexByWordId}
                    correctnessByWordId={visibleCorrectnessByWordId}
                    gradingReady={gradingReady}
                    onFilledChoiceClick={(visibleWordId) => {
                      const originalWordId =
                        originalBlankWordIdByVisibleWordId[visibleWordId];
                      if (originalWordId == null) return;

                      handleFilledChoiceClick(originalWordId);
                    }}
                    blankWidth={blankWidthPx}
                    className={`${tgtFontSize} font-ui leading-9`}
                  />
                </motion.div>

                {/* -------------------------
                //* Choice Buttons
                //* ------------------------- */}
                <div className="flex flex-wrap gap-2">
                  {shuffledChoiceIndices.map((choiceIndex) => {
                    const choice = choices[choiceIndex];
                    const isUsed = usedChoices.has(choiceIndex);

                    return (
                      <span
                        key={`${choice}-${choiceIndex}`}
                        ref={(el) => {
                          choiceSlotRefs.current[choiceIndex] = el;
                        }}
                        className={CHOICE_SLOT_CLASS_NAME}
                      >
                        {/* -------------------------
                        //* Keep original choice-bank
                        //* slots visible at all times
                        //* ------------------------- */}
                        <span
                          aria-hidden="true"
                          className={CHOICE_SLOT_SIZER_CLASS_NAME}
                        >
                          {choice}
                        </span>
                        <span
                          aria-hidden="true"
                          className={CHOICE_PLACEHOLDER_CLASS_NAME}
                        >
                          {choice}
                        </span>

                        {!isUsed ? (
                          <motion.button
                            type="button"
                            layoutId={`context-cloze-choice-${choiceIndex}`}
                            transition={CHOICE_TRANSITION}
                            onClick={() => handleChoiceClick(choiceIndex)}
                            className={CHOICE_BUTTON_CLASS_NAME}
                          >
                            {choice}
                          </motion.button>
                        ) : null}
                      </span>
                    );
                  })}
                </div>

                {/* -------------------------
                //* Source Text Footnote
                //* ------------------------- */}
                <div className="mt-auto space-y-3">
                  <Separator className="bg-border/60" />
                  <p className="font-ui text-sm italic text-muted-foreground">
                    {glossaryItem.documentTitle}
                  </p>
                </div>
              </div>
            </LayoutGroup>
          </CardContent>
          <GlossaryInfoOverlay
            glossaryItem={glossaryItem}
            enabled={isCorrect}
          />
        </Card>
      </div>
    </div>
  );
}
