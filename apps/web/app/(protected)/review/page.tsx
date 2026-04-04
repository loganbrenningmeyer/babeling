"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { ContextClozeCard } from "./feature/components/ContextClozeCard";
import { DefinitionCard } from "./feature/components/DefinitionCard";
import { RecognitionCard } from "./feature/components/RecognitionCard";

import { useRecentGlossaryItems } from "../library/feature/hooks/useRecentGlossaryItems";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";

type ReviewCardType = "context_cloze" | "definition" | "recognition";
type ReviewTransitionAction = "again" | "known";

const REVIEW_CARD_TRANSITION = {
  duration: 0.8,
  ease: [0.2, 0.8, 0.2, 1] as const,
};


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
  const cardTypes: ReviewCardType[] = [
    "context_cloze",
    "definition",
    "recognition",
  ];

  return cardTypes[Math.floor(Math.random() * cardTypes.length)];
}


/**************************
 * `renderReviewCard()`
 * -- Render the correct review card
 * variant for the glossary item.
 **************************/
function renderReviewCard(args: {
  cardType: ReviewCardType | null;
  glossaryItem: NonNullable<ReturnType<typeof useRecentGlossaryItems>["glossaryItems"]>[number];
  glossaryItems: NonNullable<ReturnType<typeof useRecentGlossaryItems>["glossaryItems"]>;
}) {
  const { cardType, glossaryItem, glossaryItems } = args;

  if (cardType === "recognition") {
    return (
      <RecognitionCard
        glossaryItem={glossaryItem}
        glossaryItems={glossaryItems}
      />
    );
  }

  if (cardType === "definition") {
    return <DefinitionCard glossaryItem={glossaryItem} />;
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
  const currentCardExitDirection =
    transitionAction === "again"
      ? -1
      : transitionAction === "known"
        ? 1
        : 0;

  const currentCardExitX =
    transitionAction === "again"
      ? "-110vw"
      : transitionAction === "known"
        ? "110vw"
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
    <div className="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden bg-background">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden px-8 py-10">
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

        <div className="mt-10 flex-1 min-h-0 overflow-hidden">
          {currentItem ? (
            <div className="flex h-full flex-col gap-6 overflow-hidden">
              <div className="grid">
                {nextItem ? (
                  <motion.div
                    aria-hidden="true"
                    className="col-start-1 row-start-1 pointer-events-none"
                    animate={
                      isTransitioning
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0.97, opacity: 0 }
                    }
                    transition={REVIEW_CARD_TRANSITION}
                  >
                    {renderReviewCard({
                      cardType: nextCardType,
                      glossaryItem: nextItem,
                      glossaryItems,
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
                          rotate: currentCardExitDirection < 0 ? -8 : 8,
                          opacity: 0,
                        }
                      : {
                          x: 0,
                          rotate: 0,
                          opacity: 1,
                        }
                  }
                  transition={REVIEW_CARD_TRANSITION}
                  onAnimationComplete={() => {
                    if (!isTransitioning) return;
                    commitTransition();
                  }}
                >
                  {renderReviewCard({
                    cardType: currentCardType,
                    glossaryItem: currentItem,
                    glossaryItems,
                  })}
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-3">
                {/* -------------------------
                //* ( X Button )
                //* ------------------------- */}
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

                {/* -------------------------
                //* ( Check Button )
                //* ------------------------- */}
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

            </div>
          ) : (
            <div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
