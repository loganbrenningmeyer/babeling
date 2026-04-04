"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";

import { ContextClozeCard } from "./cards/ContextCloze/ContextClozeCard";
import { DefinitionCard } from "./cards/DefinitionCard";
import {
  RecognitionCard,
  buildRecognitionChoices,
  type RecognitionChoice,
} from "./cards/RecognitionCard";
import type { PracticeCardType } from "../types/practice";

type PracticeTransitionAction = "again" | "known";

const PRACTICE_CARD_TRANSITION = {
  duration: 0.8,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

function shuffleIds(ids: number[]): number[] {
  const next = [...ids];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function getRandomCardType(): PracticeCardType {
  const cardTypes: PracticeCardType[] = [
    "context_cloze",
    "definition",
    "recognition",
  ];

  return cardTypes[Math.floor(Math.random() * cardTypes.length)];
}

function renderPracticeCard(args: {
  cardType: PracticeCardType | null;
  glossaryItem: LibraryGlossaryItem;
  glossaryItems: LibraryGlossaryItem[];
  recognitionChoicesById: Record<number, RecognitionChoice[]>;
}) {
  const {
    cardType,
    glossaryItem,
    glossaryItems,
    recognitionChoicesById,
  } = args;

  if (cardType === "recognition") {
    const recognitionChoices =
      recognitionChoicesById[glossaryItem.glossaryItemId];

    if (!recognitionChoices) return null;

    return (
      <RecognitionCard
        glossaryItem={glossaryItem}
        choices={recognitionChoices}
      />
    );
  }

  if (cardType === "definition") {
    return <DefinitionCard glossaryItem={glossaryItem} />;
  }

  return <ContextClozeCard glossaryItem={glossaryItem} />;
}

export function PracticeDeck({
  glossaryItems,
  emptyState,
  onRemainingChange,
}: {
  glossaryItems: LibraryGlossaryItem[];
  emptyState?: ReactNode;
  onRemainingChange?: (remaining: number) => void;
}) {
  const [queue, setQueue] = useState<number[]>([]);
  const [cardTypeById, setCardTypeById] = useState<Record<number, PracticeCardType>>(
    {}
  );
  const [recognitionChoicesById, setRecognitionChoicesById] = useState<
    Record<number, RecognitionChoice[]>
  >({});
  const [transitionAction, setTransitionAction] =
    useState<PracticeTransitionAction | null>(null);

  useEffect(() => {
    const ids = glossaryItems.map((item) => item.glossaryItemId);
    const shuffledIds = shuffleIds(ids);
    const sessionSeed = Math.floor(Math.random() * 4294967296);

    setQueue(shuffledIds);
    setCardTypeById(
      Object.fromEntries(
        shuffledIds.map((id) => [id, getRandomCardType()])
      ) as Record<number, PracticeCardType>
    );
    setRecognitionChoicesById(
      Object.fromEntries(
        glossaryItems.map((item) => [
          item.glossaryItemId,
          buildRecognitionChoices({
            glossaryItem: item,
            glossaryItems,
            choiceSeed: sessionSeed,
          }),
        ])
      ) as Record<number, RecognitionChoice[]>
    );
    setTransitionAction(null);
  }, [glossaryItems]);

  useEffect(() => {
    onRemainingChange?.(queue.length);
  }, [onRemainingChange, queue.length]);

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

  function handleAgain() {
    if (isTransitioning || queue.length <= 1) return;
    setTransitionAction("again");
  }

  function handleKnown() {
    if (isTransitioning || queue.length === 0) return;
    setTransitionAction("known");
  }

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

  if (!currentItem) {
    return <>{emptyState ?? <div />}</>;
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid py-8">
        {nextItem ? (
          <motion.div
            aria-hidden="true"
            className="col-start-1 row-start-1 pointer-events-none"
            animate={
              isTransitioning
                ? { scale: 1, opacity: 1 }
                : { scale: 0.97, opacity: 0 }
            }
            transition={PRACTICE_CARD_TRANSITION}
          >
            {renderPracticeCard({
              cardType: nextCardType,
              glossaryItem: nextItem,
              glossaryItems,
              recognitionChoicesById,
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
          transition={PRACTICE_CARD_TRANSITION}
          onAnimationComplete={() => {
            if (!isTransitioning) return;
            commitTransition();
          }}
        >
          {renderPracticeCard({
            cardType: currentCardType,
            glossaryItem: currentItem,
            glossaryItems,
            recognitionChoicesById,
          })}
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAgain}
          disabled={isTransitioning}
          className="h-12 w-12 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>

        <Button
          type="button"
          size="icon"
          onClick={handleKnown}
          disabled={isTransitioning}
          className="h-12 w-12 rounded-full"
        >
          <Check className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
