"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { RecognitionCard } from "./feature/components/RecognitionCard";
import { ContextClozeCard } from "./feature/components/ContextClozeCard";

import { useRecentGlossaryItems } from "../library/feature/hooks/useRecentGlossaryItems";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";

type ReviewCardType = "context_cloze" | "recognition";
type ReviewTransitionAction = "again" | "known";


/**************************
 * `shuffleIds()`
 * -- Shuffle glossary item IDs so the
 * review queue changes order each time
 * the deck is initialized.
 **************************/
function shuffleIds(ids: number[]): number[] {
  const next = [...ids];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}


/**************************
 * `getRandomCardType()`
 * -- Randomly choose which review card
 * variant to render for a glossary item.
 **************************/
function getRandomCardType(): ReviewCardType {
  return Math.random() < 0.5 ? "context_cloze" : "recognition";
}


/**************************
 * `renderReviewCard()`
 * -- Render the correct review card
 * variant for the glossary item.
 **************************/
function renderReviewCard(args: {
  cardType: ReviewCardType | null;
  glossaryItem: NonNullable<ReturnType<typeof useRecentGlossaryItems>["glossaryItems"]>[number];
}) {
  const { cardType, glossaryItem } = args;

  if (cardType === "recognition") {
    return <RecognitionCard glossaryItem={glossaryItem} />;
  }

  return <ContextClozeCard glossaryItem={glossaryItem} />;
}


export default function Review() {
  const m = useMessages();



  // -------------------------
  // Get Glossary Items
  // -------------------------
  const { glossaryItems } = useRecentGlossaryItems();

  // -------------------------
  // Set queue of glossary items by ID
  // -------------------------
  const [queue, setQueue] = useState<number[]>([]);
  const [cardTypeById, setCardTypeById] = useState<Record<number, ReviewCardType>>(
    {}
  );
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<string[]>([]);

  // -------------------------
  // Build available language filters
  // -------------------------
  const targetLanguageOptions = useMemo(
    () =>
      Array.from(new Set(glossaryItems.map((item) => item.tgtLang)))
        .sort((a, b) =>
          m.langs[toUiLang(a)].localeCompare(m.langs[toUiLang(b)])
        ),
    [glossaryItems, m.langs]
  );

  // -------------------------
  // Filter review items by target language
  // -------------------------
  const filteredGlossaryItems = useMemo(
    () =>
      selectedTargetLanguages.length === 0
        ? glossaryItems
        : glossaryItems.filter((item) =>
            selectedTargetLanguages.includes(item.tgtLang)
          ),
    [glossaryItems, selectedTargetLanguages]
  );

  useEffect(() => {
    const ids = filteredGlossaryItems.map((item) => item.glossaryItemId);
    const shuffledIds = shuffleIds(ids);

    setQueue(shuffledIds);
    setCardTypeById(
      Object.fromEntries(
        shuffledIds.map((id) => [id, getRandomCardType()])
      ) as Record<number, ReviewCardType>
    );
  }, [filteredGlossaryItems]);

  const glossaryById = useMemo(
    () => 
      Object.fromEntries(
        glossaryItems.map((item) => [item.glossaryItemId, item])
      ),
    [glossaryItems]
  );

  const currentId = queue[0];
  const currentItem = currentId ? glossaryById[currentId] : null;
  const currentCardType = currentId ? cardTypeById[currentId] : null;
  const nextId = queue[1];
  const nextItem = nextId ? glossaryById[nextId] : null;
  const nextCardType = nextId ? cardTypeById[nextId] : null;

  // -------------------------
  // Track swipe transition state
  // -------------------------
  const [transitionAction, setTransitionAction] =
    useState<ReviewTransitionAction | null>(null);

  const isTransitioning = transitionAction != null;

  const currentCardExitX =
    transitionAction === "again"
      ? -900
      : transitionAction === "known"
        ? 900
        : 0;

  /**************************
   * `toggleTargetLanguage()`
   * --
   * Toggle target-language filters.
   * When nothing is selected, the
   * review deck includes all languages.
   **************************/
  function toggleTargetLanguage(lang: string) {
    if (isTransitioning) return;

    setSelectedTargetLanguages((current) =>
      current.includes(lang)
        ? current.filter((value) => value !== lang)
        : [...current, lang]
    );
  }

  // -------------------------
  // ( X Button ): Puts word back in line in the queue
  // -------------------------
  function handleAgain() {
    if (isTransitioning || queue.length <= 1) return;
    setTransitionAction("again");
  }

  // -------------------------
  // ( Check Button ): Removes word from queue
  // -------------------------
  function handleKnown() {
    if (isTransitioning || queue.length === 0) return;
    setTransitionAction("known");
  }

  /**************************
   * `commitTransition()`
   * --
   * Apply the queue update only after
   * the swipe animation finishes so
   * the next card can expand underneath.
   **************************/
  function commitTransition() {
    if (transitionAction === "again") {
      setQueue((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }

    if (transitionAction === "known") {
      setQueue((prev) => prev.slice(1));
    }

    setTransitionAction(null);
  }

  return (
    <div className="min-h-screen mx-auto max-w-6xl py-12 px-8">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <h1 className="font-reading font-semibold text-4xl tracking-tight">
          Review
        </h1>

        <p className="mt-3 font-ui text-lg text-muted-foreground">
          {queue.length} remaining
        </p>

        {/* -------------------------
        //* Target Language Filters
        //* ------------------------- */}
        <div className="mt-6 flex flex-col gap-2">
          <div
            className="
              font-ui uppercase tracking-widest
              text-xs text-foreground/80
            "
          >
            Target Language
          </div>
          <div className="flex flex-wrap gap-2">
            {targetLanguageOptions.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleTargetLanguage(lang)}
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-full border px-3",
                  "font-ui text-xs font-medium tracking-wide",
                  "cursor-pointer select-none transition-colors duration-200 ease-out",
                  "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  selectedTargetLanguages.includes(lang) &&
                    "border-primary/30 bg-primary/5 text-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {m.langs[toUiLang(lang)]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {currentItem ? (
            <div className="space-y-6">
              <div className="grid">
                {nextItem ? (
                  <motion.div
                    aria-hidden="true"
                    className="col-start-1 row-start-1 pointer-events-none"
                    animate={
                      isTransitioning
                        ? { scale: 1, y: 0, opacity: 1 }
                        : { scale: 0.97, y: 10, opacity: 0 }
                    }
                    transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    {renderReviewCard({
                      cardType: nextCardType,
                      glossaryItem: nextItem,
                    })}
                  </motion.div>
                ) : null}

                <motion.div
                  key={`${currentItem.glossaryItemId}-${currentCardType}`}
                  className="col-start-1 row-start-1 z-10"
                  animate={
                    isTransitioning
                      ? {
                          x: currentCardExitX,
                          rotate: currentCardExitX < 0 ? -8 : 8,
                          opacity: 0,
                        }
                      : {
                          x: 0,
                          rotate: 0,
                          opacity: 1,
                        }
                  }
                  transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  onAnimationComplete={() => {
                    if (!isTransitioning) return;
                    commitTransition();
                  }}
                >
                  {renderReviewCard({
                    cardType: currentCardType,
                    glossaryItem: currentItem,
                  })}
                </motion.div>
              </div>

              {/* -------------------------
              //* ( X Button )
              //* ------------------------- */}
              <div className="flex items-center justify-center gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAgain}
                  disabled={isTransitioning}
                  className="h-12 w-12 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>

                <Button 
                  type="button"
                  size="icon"
                  onClick={handleKnown}
                  disabled={isTransitioning}
                  className="h-12 w-12 rounded-full"
                >
                  <Check className="w-5 h-5" />
                </Button>
              </div>

              {/* -------------------------
              //* ( Check Button )
              //* ------------------------- */}
            </div>
          ) : (
            <div>

            </div>
          )}
        </div>
    </div>
  );
}
