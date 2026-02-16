import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick } from "lucide-react";

export function IPAClickInfo({ className }: { className?: string }) {
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "flex flex-col items-center overflow-hidden rounded-xl bg-muted/40 border border-border/40 shadow-sm",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-1 px-3 py-2 text-[12px] text-muted-foreground">
          <MousePointerClick className="h-3 w-3" />
          <span className="font-bold">
            {`Click `}
            <Badge 
              variant="outline" 
              className="h-6 inline-flex text-sm font-mono text-muted-foreground"
            >
              <span className="
                font-mono underline underline-offset-3
                decoration-dotted decoration-1 decoration-muted-foreground
              ">
                IPA
              </span>
            </Badge>
            {` to hear pronunciation`}
          </span>
        </div>

        {/* Body */}
        <div className="flex w-full flex-col gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              Click
            </kbd>
            <span className="mx-0.5">:</span>
            <span>Play pronunciation audio</span>
          </span>
        </div>
      </div>
    </div>
  );
}
