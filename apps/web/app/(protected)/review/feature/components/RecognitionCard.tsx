"use client";

import { useMemo, useState } from "react";

import { LangBadge } from "@/app/components/LangBadge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";

const MAX_CHOICES = 4;
const SUCCESS_CARD_CLASS_NAME =
  "border-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.18)]";

type RecognitionChoice = {
  gloss: string;
  isCorrect: boolean;
};


/**************************
 * `shuffleWithSeed()`
 * -- Deterministically shuffle arrays
 * so choice order stays stable per card.
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


/**************************
 * `buildRecognitionChoices()`
 * -- Build one correct gloss plus
 * up to three plausible distractors.
 **************************/
function buildRecognitionChoices(args: {
  glossaryItem: LibraryGlossaryItem;
  glossaryItems: LibraryGlossaryItem[];
}): RecognitionChoice[] {
  const { glossaryItem, glossaryItems } = args;
  const correctGloss = glossaryItem.definition.gloss.trim();
  const correctGlossKey = normalizeGloss(correctGloss);
  const preferredDistractors: string[] = [];
  const fallbackDistractors: string[] = [];
  const seenGlosses = new Set<string>([correctGlossKey]);

  // -------------------------
  // Prefer same-language and same-POS
  // distractors before falling back
  // to the rest of the glossary pool
  // -------------------------
  const sameLanguageItems = glossaryItems.filter(
    (item) => item.tgtLang === glossaryItem.tgtLang
  );
  const fallbackItems = glossaryItems.filter(
    (item) => item.tgtLang !== glossaryItem.tgtLang
  );

  for (const item of [...sameLanguageItems, ...fallbackItems]) {
    if (item.glossaryItemId === glossaryItem.glossaryItemId) continue;

    const gloss = item.definition.gloss.trim();
    const glossKey = normalizeGloss(gloss);

    if (!gloss || seenGlosses.has(glossKey)) continue;
    seenGlosses.add(glossKey);

    const hasMatchingPos =
      item.definition.posLemma === glossaryItem.definition.posLemma ||
      item.definition.posForm === glossaryItem.definition.posForm;

    if (hasMatchingPos) {
      preferredDistractors.push(gloss);
      continue;
    }

    fallbackDistractors.push(gloss);
  }

  const distractors = [
    ...shuffleWithSeed(preferredDistractors, glossaryItem.glossaryItemId + 1),
    ...shuffleWithSeed(fallbackDistractors, glossaryItem.glossaryItemId + 2),
  ].slice(0, MAX_CHOICES - 1);

  return shuffleWithSeed(
    [
      { gloss: correctGloss, isCorrect: true },
      ...distractors.map((gloss) => ({ gloss, isCorrect: false })),
    ],
    glossaryItem.glossaryItemId + 3
  );
}


/**************************
 * `RecognitionCard()`
 * -- Given a target word, choose the
 * correct definition from multiple choices.
 **************************/
export function RecognitionCard({
  glossaryItem,
  glossaryItems,
}: {
  glossaryItem: LibraryGlossaryItem;
  glossaryItems: LibraryGlossaryItem[];
}) {
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);

  // -------------------------
  // Build a stable choice bank
  // for the current glossary item
  // -------------------------
  const choices = useMemo(
    () => buildRecognitionChoices({ glossaryItem, glossaryItems }),
    [glossaryItem, glossaryItems]
  );
  const isCorrect =
    selectedChoiceIndex != null && choices[selectedChoiceIndex]?.isCorrect === true;

  function handleChoiceClick(choiceIndex: number) {
    if (selectedChoiceIndex != null) return;

    setSelectedChoiceIndex(choiceIndex);
  }

  return (
    <div className="mx-auto w-full max-w-xl text-left">
      <div className="relative aspect-[4/3] w-full">
        <Card
          className={cn(
            `
              relative h-full w-full overflow-hidden rounded-xl
              border bg-card p-5 shadow-sm
              transition-[border-color,box-shadow] duration-300 ease-out
            `,
            isCorrect && SUCCESS_CARD_CLASS_NAME
          )}
        >
          <div className="pointer-events-none absolute left-5 top-5 z-10">
            <LangBadge lang={glossaryItem.tgtLang} className="text-sm" />
          </div>

          <CardContent className="flex h-full flex-col p-0">
            <div className="flex flex-1 flex-col justify-center gap-8">
              {/* -------------------------
              //* Prompt
              //* ------------------------- */}
              <div className="font-reading text-center text-5xl font-semibold leading-none sm:text-6xl">
                {glossaryItem.definition.form}
              </div>

              {/* -------------------------
              //* Multiple Choice Buttons
              //* ------------------------- */}
              <div className="grid gap-3">
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
                          rounded-xl border px-4 py-3 text-left
                          font-ui text-base leading-6
                          transition-colors duration-150
                        `,
                        !showGrading &&
                          `
                            border-border bg-card text-foreground
                            hover:border-foreground/30 hover:bg-muted/30
                          `,
                        showGrading &&
                          choice.isCorrect &&
                          "border-emerald-500 bg-emerald-500/10 text-foreground",
                        showGrading &&
                          isSelected &&
                          !choice.isCorrect &&
                          "border-rose-500 bg-rose-500/10 text-foreground",
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
        </Card>
      </div>
    </div>
  );
}
