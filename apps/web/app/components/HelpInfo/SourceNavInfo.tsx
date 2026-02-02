import { cn } from "@/lib/utils";
import { Text } from "lucide-react"
                     

export function SourceNavInfo({ className } : { className?: string; }) {
  return (
    <div className="flex justify-center">
      {/* -------------------------
      //* Source Navigation (Sentence / Paragraph)
      //* ------------------------- */}
      <div className={cn("flex flex-col items-center overflow-hidden rounded-xl bg-muted/40 border border-border/40 shadow-sm", className)}>
        <div className="flex items-center gap-1 py-2 px-3 text-[12px] text-muted-foreground">
          <Text className="h-3 w-3" />
          <span className="font-bold">
            {`Reveal / hide  `}
            <span className="bg-blue-500/20">
              original text
            </span>
          </span>
        </div>
        <div className="flex w-full flex-col gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              →
            </kbd>
            <span className="mx-0.5">:</span>
            <span>Reveal sentence</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ←
            </kbd>
            <span className="mx-0.5">:</span>
            <span>Hide sentence</span>
          </span>

          <div className="my-1 h-px w-full bg-border/60" />

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↓
            </kbd>
            <span className="mx-0.5">:</span>
            <span>Reveal paragraph</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↑
            </kbd>
            <span className="mx-0.5">:</span>
            <span>Hide paragraph</span>
          </span>

        </div>
      </div>
    </div>
  );
}
                     
