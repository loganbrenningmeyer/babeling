import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { BlurMode } from "@/app/components/SourceBlur/BlurModeToggle";
import { BlurModeToggle } from "@/app/components/SourceBlur/BlurModeToggle";
import { HelpPopover } from "@/app/components/HelpInfo/HelpPopover";

type ReaderToolbarProps = {
  blurMode: BlurMode;
  onBlurModeChange: (mode: BlurMode) => void;

  pageId: number;
  pagesCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function ReaderToolbar({
  blurMode,
  onBlurModeChange,
  pageId,
  pagesCount,
  onPrevPage,
  onNextPage,
}: ReaderToolbarProps) {
  return (
    <div className="m-4 pointer-events-auto rounded-2xl border bg-background/95 py-4 shadow-lg backdrop-blur">
      <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4">
        <div className="flex justify-start items-center pl-3">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="rounded-sm shadow-md border border-gray-300 transition-colors hover:bg-foreground/10 hover:text-foreground"
            onClick={onPrevPage}
            aria-label="Previous page"
            disabled={pageId <= 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center">
          <BlurModeToggle
            value={blurMode}
            onChange={onBlurModeChange}
            className="border shadow"
          />
        </div>

        <div className="flex justify-center">
          <div className="rounded-full border px-3 py-1 text-sm font-semibold text-muted-foreground">
            Page {pagesCount > 0 ? pageId + 1 : 0} / {pagesCount}
          </div>
        </div>

        <div className="flex justify-left pointer-events-none">
          <div className="pointer-events-auto">
            <HelpPopover />
          </div>
        </div>

        <div className="flex justify-end pr-3">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="rounded-sm shadow-md border border-gray-300 transition-colors hover:bg-foreground/10 hover:text-foreground"
            onClick={onNextPage}
            aria-label="Next page"
            disabled={pageId >= pagesCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
