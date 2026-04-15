"use client";

import { useState } from "react";

import { LangBadge } from "@/app/components/LangBadge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { GlossaryInfoOverlay } from "./GlossaryInfoOverlay";
import type { PracticeItem } from "../../types/practiceItem";

const MAX_CHOICES = 4;
const SUCCESS_CARD_CLASS_NAME =
  "border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.18)]";

export type RecognitionChoice = {
  gloss: string;
  isCorrect: boolean;
};


/**************************
 * `shuffleWithSeed()`
 * -- Deterministically shuffle arrays
 * so choice order stays stable for the
 * lifetime of one mounted review card.
 **************************/
function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let state = seed || 1;

  function nextRandom() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  }

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}


/**************************
 * `normalizeGloss()`
 * -- Normalize gloss text so duplicate
 * answer choices can be removed safely.
 **************************/
function normalizeGloss(gloss: string): string {
  return gloss.trim().toLocaleLowerCase();
}

function hashStringSeed(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return hash || 1;
}


/**************************
 * `buildRecognitionChoices()`
 * -- Build one correct gloss plus
 * up to three plausible distractors.
 **************************/
export function buildRecognitionChoices(args: {
  practiceItem: PracticeItem;
  practiceItems: PracticeItem[];
  choiceSeed: number;
}): RecognitionChoice[] {
  const { practiceItem, practiceItems, choiceSeed } = args;
  const correctGloss = practiceItem.definition.gloss.trim();
  const correctGlossKey = normalizeGloss(correctGloss);
  const preferredDistractors: string[] = [];
  const fallbackDistractors: string[] = [];
  const seenGlosses = new Set<string>([correctGlossKey]);
  const itemSeed = choiceSeed + hashStringSeed(practiceItem.practiceItemId) * 31;

  // -------------------------
  // Prefer same-language and same-POS
  // distractors before falling back
  // to the rest of the glossary pool
  // -------------------------
  const sameLanguageItems = practiceItems.filter(
    (item) => item.tgtLang === practiceItem.tgtLang
  );
  const fallbackItems = practiceItems.filter(
    (item) => item.tgtLang !== practiceItem.tgtLang
  );

  for (const item of [...sameLanguageItems, ...fallbackItems]) {
    if (item.practiceItemId === practiceItem.practiceItemId) continue;

    const gloss = item.definition.gloss.trim();
    const glossKey = normalizeGloss(gloss);

    if (!gloss || seenGlosses.has(glossKey)) continue;
    seenGlosses.add(glossKey);

    const hasMatchingPos =
      item.definition.posLemma === practiceItem.definition.posLemma ||
      item.definition.posForm === practiceItem.definition.posForm;

    if (hasMatchingPos) {
      preferredDistractors.push(gloss);
      continue;
    }

    fallbackDistractors.push(gloss);
  }

  const distractors = [
    ...shuffleWithSeed(preferredDistractors, itemSeed + 1),
    ...shuffleWithSeed(fallbackDistractors, itemSeed + 2),
  ].slice(0, MAX_CHOICES - 1);

  return shuffleWithSeed(
    [
      { gloss: correctGloss, isCorrect: true },
      ...distractors.map((gloss) => ({ gloss, isCorrect: false })),
    ],
    itemSeed + 3
  );
}


/**************************
 * `RecognitionCard()`
 * -- Given a target word, choose the
 * correct definition from multiple choices.
 **************************/
export function RecognitionCard({
  practiceItem,
  choices,
}: {
  practiceItem: PracticeItem;
  choices: RecognitionChoice[];
}) {
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);
  const showInfoFromStart = practiceItem.source === "page";
  const hasMadeFirstGuess = selectedChoiceIndex != null;
  const isCorrect =
    hasMadeFirstGuess && choices[selectedChoiceIndex]?.isCorrect === true;

  function handleChoiceClick(choiceIndex: number) {
    if (selectedChoiceIndex != null) return;

    setSelectedChoiceIndex(choiceIndex);
  }

  return (
    <div className="mx-auto w-full max-w-xl text-left">
      <div className="relative h-[min(62vh,31rem)] min-h-[24rem] w-full sm:aspect-[4/3] sm:h-auto sm:min-h-0">
        <Card
          className={cn(
            `
              relative h-full w-full overflow-hidden rounded-xl
              border bg-card p-4 shadow-sm sm:p-5
              transition-[border-color,box-shadow] duration-300 ease-out
            `,
            isCorrect && SUCCESS_CARD_CLASS_NAME
          )}
        >
          <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
            <LangBadge lang={practiceItem.tgtLang} className="text-xs sm:text-sm" />
          </div>

          <CardContent className="flex h-full flex-col p-0">
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-5 pt-8 sm:gap-8 sm:pt-0">
              {/* -------------------------
              //* Prompt
              //* ------------------------- */}
              <div className="break-words text-center font-reading text-4xl font-semibold leading-none sm:text-6xl">
                {practiceItem.definition.form}
              </div>

              {/* -------------------------
              //* Multiple Choice Buttons
              //* ------------------------- */}
              <div className="grid min-h-0 gap-2 overflow-y-auto pr-1 sm:gap-3 sm:overflow-visible sm:pr-0">
                {choices.map((choice, choiceIndex) => {
                  const isSelected = selectedChoiceIndex === choiceIndex;
                  const showGrading = selectedChoiceIndex != null;

                  return (
                    <button
                      key={`${choice.gloss}-${choiceIndex}`}
                      type="button"
                      onClick={() => handleChoiceClick(choiceIndex)}
                      disabled={showGrading}
                      className={cn(
                        `
                          rounded-xl border px-3 py-2.5 text-left
                          font-ui text-sm leading-5 sm:px-4 sm:py-3 sm:text-base sm:leading-6
                          transition-colors duration-150
                        `,
                        !showGrading &&
                          `
                            border-border bg-card text-foreground
                            hover:border-foreground/30 hover:bg-muted/15
                            cursor-pointer
                          `,
                        showGrading &&
                          choice.isCorrect &&
                          "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold",
                        showGrading &&
                          isSelected &&
                          !choice.isCorrect &&
                          "border-rose-500 bg-rose-500/10 text-muted-foreground",
                        showGrading &&
                          !choice.isCorrect &&
                          !isSelected &&
                          "border-border/70 bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {choice.gloss.toLocaleLowerCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <GlossaryInfoOverlay
            practiceItem={practiceItem}
            enabled={showInfoFromStart || hasMadeFirstGuess}
          />
        </Card>
      </div>
    </div>
  );
}
