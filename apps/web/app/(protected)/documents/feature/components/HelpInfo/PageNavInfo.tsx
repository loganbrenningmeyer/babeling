import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react"
                     
import { messages, UiLang } from "@/app/i18n/messages";

type pageNavMessages = (typeof messages)[UiLang]["reader"]["helpPopover"]["pageNav"];

export function PageNavInfo({ msgs }: { msgs: pageNavMessages }) {
  return (
    <div className="flex justify-center">
      {/* -------------------------
      //* Source Navigation (Sentence / Paragraph)
      //* ------------------------- */}
      <div className="
        w-full
        flex flex-col items-center 
        overflow-hidden rounded-xl bg-muted/40 
        border border-border/40 shadow-sm
      ">
        <div className="flex items-center gap-2 py-2 px-3 text-[12px] text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="font-bold">
            {msgs.header}
          </span>
        </div>
        <div className="flex w-full flex-col gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ←
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.prevPage}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              →
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.nextPage}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
                     
