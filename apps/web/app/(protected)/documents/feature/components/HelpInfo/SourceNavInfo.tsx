import { cn } from "@/lib/utils";
import { TextSelect } from "lucide-react"

import { messages, UiLang } from "@/app/i18n/messages";

type sourceNavMessages = (typeof messages)[UiLang]["reader"]["helpPopover"]["sourceNav"]

export function SourceNavInfo({ msgs }: { msgs: sourceNavMessages }) {
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
          <TextSelect className="h-4 w-4" />
          <span className="font-bold">
            {msgs.header.prefix}{" "}
            <span className="bg-blue-500/20">{msgs.header.highlight}</span>
            {" "}{msgs.header.suffix}
          </span>
        </div>
        <div className="flex w-full flex-col gap-1 border-t border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              →
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.revealSent}</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ←
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.hideSent}</span>
          </span>

          <div className="my-1 h-px w-full bg-border/60" />

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↓
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.revealPar}</span>
          </span>

          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs font-semibold text-foreground shadow-sm">
              ↑
            </kbd>
            <span className="mx-0.5">:</span>
            <span>{msgs.hidePar}</span>
          </span>

        </div>
      </div>
    </div>
  );
}
                     
