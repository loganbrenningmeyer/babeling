import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react"
                     

export function PageNavInfo({ className } : { className?: string; }) {
  return (
    <div className="flex justify-center">
      <div className={cn("flex flex-col items-center overflow-hidden rounded-xl bg-muted/40 border border-border/40 shadow-sm", className)}>
        <div className="flex items-center gap-1 px-3 text-[10px] text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>Arrow keys navigate</span>
        </div>
        <div className="flex w-full flex-col items-center gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:gap-2">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ←
            </kbd>
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              →
            </kbd>
            <span>Sentence</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↑
            </kbd>
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↓
            </kbd>
            <span>Paragraph</span>
          </span>
        </div>
      </div>
    </div>
  );
}
                     
