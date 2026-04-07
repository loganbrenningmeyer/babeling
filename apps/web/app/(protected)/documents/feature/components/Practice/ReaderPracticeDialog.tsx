"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PracticeDeck } from "@/app/(protected)/practice/feature/components/PracticeDeck";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";
import { useMessages } from "@/app/hooks/useMessages";


/**************************
 * `ReaderPracticeDialog()`
 * -- Modal practice surface for
 *    page-based flashcard review
 **************************/
export function ReaderPracticeDialog({
  open,
  onOpenChange,
  practiceItems,
  loading,
  canRestart,
  onRestart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceItems: PracticeItem[];
  loading: boolean;
  canRestart: boolean;
  onRestart: () => void;
}) {
  const m = useMessages();
  const [remainingCount, setRemainingCount] = useState(practiceItems.length);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setRemainingCount(practiceItems.length);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [practiceItems.length, open]);

  const totalCount = practiceItems.length;
  const completedCount = Math.max(0, totalCount - remainingCount);
  const progressValue =
    totalCount === 0 ? 0 : (completedCount / totalCount) * 100;
  const batchComplete = totalCount > 0 && remainingCount === 0;
  const pageExhausted = batchComplete && !canRestart;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-background/35 backdrop-blur-sm"
        className="
          max-w-4xl border-none bg-transparent p-0 shadow-none
          sm:max-w-4xl
        "
      >
        <DialogTitle className="sr-only">
          {m.reader.footer.practice}
        </DialogTitle>
        <div
          className="
            mx-auto flex h-[min(78vh,44rem)] w-full max-w-4xl flex-col
            rounded-2xl border border-border/70 bg-background/92
            px-5 py-5 shadow-2xl
          "
        >
          <div className="mb-3 space-y-2">
            <div className="flex gap-4 font-ui text-md text-muted-foreground">
              <span>
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress value={progressValue} />
          </div>

          <div className="min-h-0 flex-1">
            {loading ? (
              <div className="flex h-full items-center justify-center -mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PracticeDeck
                practiceItems={practiceItems}
                onRemainingChange={setRemainingCount}
                emptyState={
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    {!batchComplete ? (
                      <div className="font-ui text-sm text-muted-foreground">
                        {m.reader.footer.noPracticeItems}
                      </div>
                    ) : null}
                    {pageExhausted ? (
                      <div className="font-ui text-sm text-muted-foreground">
                        {m.reader.footer.practiceComplete}
                      </div>
                    ) : null}
                    {batchComplete && canRestart ? (
                      <Button type="button" onClick={onRestart}>
                        <RotateCw className="size-4" />
                        {m.reader.footer.practiceMoreWords}
                      </Button>
                    ) : null}
                  </div>
                }
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
