import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react"
                     

export function PageNavInfo({ className } : { className?: string; }) {
  return (
    <div className="flex justify-center">
      {/* -------------------------
      //* Source Navigation (Sentence / Paragraph)
      //* ------------------------- */}
      <div className={cn("flex flex-col items-center overflow-hidden rounded-xl bg-muted/40 border border-border/40 shadow-sm", className)}>
        <div className="flex items-center gap-1 py-2 px-3 text-[12px] text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          <span className="font-bold">
            Page navigation
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
            <span>Previous page</span>
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
            <span>Next page</span>
          </span>
        </div>
      </div>
    </div>
  );
}
                     
