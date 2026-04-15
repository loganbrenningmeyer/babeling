"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Redo2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

import { ContextClozeCard } from "./cards/ContextCloze/ContextClozeCard";
import { DefinitionCard } from "./cards/DefinitionCard";
import {
  RecognitionCard,
  buildRecognitionChoices,
  type RecognitionChoice,
} from "./cards/RecognitionCard";
import type { PracticeCardType } from "../types/practice";
import type { PracticeItem } from "../types/practiceItem";

type PracticeTransitionAction = "again" | "known";

const PRACTICE_CARD_TRANSITION = {
  duration: 0.8,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

function shuffleIds(ids: string[]): string[] {
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
  practiceItem: PracticeItem;
  recognitionChoicesById: Record<string, RecognitionChoice[]>;
}) {
  const {
    cardType,
    practiceItem,
    recognitionChoicesById,
  } = args;

  if (cardType === "recognition") {
    const recognitionChoices =
      recognitionChoicesById[practiceItem.practiceItemId];

    if (!recognitionChoices) return null;

    return (
      <RecognitionCard
        practiceItem={practiceItem}
        choices={recognitionChoices}
      />
    );
  }

  if (cardType === "definition") {
    return <DefinitionCard practiceItem={practiceItem} />;
  }

  return <ContextClozeCard practiceItem={practiceItem} />;
}

export function PracticeDeck({
  practiceItems,
  emptyState,
  onRemainingChange,
}: {
  practiceItems: PracticeItem[];
  emptyState?: ReactNode;
  onRemainingChange?: (remaining: number) => void;
}) {
  const [queue, setQueue] = useState<string[]>([]);
  const [cardTypeById, setCardTypeById] = useState<Record<string, PracticeCardType>>(
    {}
  );
  const [recognitionChoicesById, setRecognitionChoicesById] = useState<
    Record<string, RecognitionChoice[]>
  >({});
  const [transitionAction, setTransitionAction] =
    useState<PracticeTransitionAction | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const ids = practiceItems.map((item) => item.practiceItemId);
      const shuffledIds = shuffleIds(ids);
      const sessionSeed = Math.floor(Math.random() * 4294967296);

      setQueue(shuffledIds);
      setCardTypeById(
        Object.fromEntries(
          shuffledIds.map((id) => [id, getRandomCardType()])
        ) as Record<string, PracticeCardType>
      );
      setRecognitionChoicesById(
        Object.fromEntries(
          practiceItems.map((item) => [
            item.practiceItemId,
            buildRecognitionChoices({
              practiceItem: item,
              practiceItems,
              choiceSeed: sessionSeed,
            }),
          ])
        ) as Record<string, RecognitionChoice[]>
      );
      setTransitionAction(null);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [practiceItems]);

  useEffect(() => {
    onRemainingChange?.(queue.length);
  }, [onRemainingChange, queue.length]);

  const practiceById = useMemo(
    () =>
      Object.fromEntries(
        practiceItems.map((item) => [item.practiceItemId, item])
      ),
    [practiceItems]
  );

  const currentId = queue[0];
  const currentItem = currentId ? practiceById[currentId] : null;
  const currentCardType = currentId ? cardTypeById[currentId] : null;
  const nextId = queue[1];
  const nextItem = nextId ? practiceById[nextId] : null;
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
    <div className="flex h-full min-h-0 flex-col gap-3 sm:gap-6">
      <div className="grid min-h-0 flex-1 items-center py-2 sm:py-8">
        {nextItem ? (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 min-h-0"
            animate={
              isTransitioning
                ? { scale: 1, opacity: 1 }
                : { scale: 0.97, opacity: 0 }
            }
            transition={PRACTICE_CARD_TRANSITION}
          >
            {renderPracticeCard({
              cardType: nextCardType,
              practiceItem: nextItem,
              recognitionChoicesById,
            })}
          </motion.div>
        ) : null}

        <motion.div
          key={`${currentItem.practiceItemId}-${currentCardType}`}
          className="col-start-1 row-start-1 z-10 min-h-0"
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
            practiceItem: currentItem,
            recognitionChoicesById,
          })}
        </motion.div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-3 pb-1 sm:pb-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAgain}
          disabled={isTransitioning}
          className="h-12 w-12 rounded-full"
        >
          <Redo2 className="h-5 w-5" />
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
