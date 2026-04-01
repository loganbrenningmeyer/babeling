"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check } from "lucide-react";

import { RecognitionCard } from "./feature/components/RecognitionCard";

import { useRecentGlossaryItems } from "../library/feature/hooks/useRecentGlossaryItems";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/app/hooks/useMessages";


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

  useEffect(() => {
    setQueue(glossaryItems.map((item) => item.glossaryItemId));
  }, [glossaryItems]);

  const glossaryById = useMemo(
    () => 
      Object.fromEntries(
        glossaryItems.map((item) => [item.glossaryItemId, item])
      ),
    [glossaryItems]
  );

  const currentId = queue[0];
  const currentItem = currentId ? glossaryById[currentId] : null;

  // -------------------------
  // ( X Button ): Puts word back in line in the queue
  // -------------------------
  function handleAgain() {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  }

  // -------------------------
  // ( Check Button ): Removes word from queue
  // -------------------------
  function handleKnown() {
    setQueue((prev) => prev.slice(1));
  }

  return (
    <div className="min-h-screen mx-auto max-w-6xl py-12 px-8">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <h1 className="font-reading font-semibold text-4xl tracking-tight">
          Review
        </h1>

        <p className="mt-3 font-ui text-sm text-muted-foreground">
          {queue.length} remaining
        </p>

        <div className="mt-10">
          {currentItem ? (
            <div className="space-y-6">
              <RecognitionCard 
                key={currentItem.glossaryItemId}
                glossaryItem={currentItem} 
              />

              {/* -------------------------
              //* ( X Button )
              //* ------------------------- */}
              <div className="flex items-center justify-center gap-3">
                <Button 
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAgain}
                  className="h-12 w-12 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>

                <Button 
                  type="button"
                  size="icon"
                  onClick={handleKnown}
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