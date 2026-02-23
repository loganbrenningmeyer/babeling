import { cn } from "@/lib/utils";
import { MousePointerClick, EyeOff } from "lucide-react";

import { messages, UiLang } from "@/app/i18n/messages";

type sourceClickMessages = (typeof messages)[UiLang]["reader"]["helpPopover"]["sourceClick"]

export function SourceClickInfo({ msgs }: { msgs: sourceClickMessages }) {
  return (
    <div className="flex justify-center">
      <div className="
        w-full
        flex flex-col items-center 
        overflow-hidden rounded-xl bg-muted/40 
        border border-border/40 shadow-sm
      ">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground">
          <EyeOff className="h-4 w-4" />
          <span className="font-bold">
            {msgs.header.prefix}{" "}
            <span className="bg-blue-500/20">{msgs.header.highlight}</span>
            {" "}{msgs.header.suffix}
          </span>
        </div>

        {/* Body */}
        <div className="flex w-full flex-col gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              <MousePointerClick className="h-3 w-3" />
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.toggleVis}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
