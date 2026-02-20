import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MousePointerClick } from "lucide-react";

import { messages, UiLang } from "@/app/i18n/messages";

export type BlurMode = "word" | "sentence" | "paragraph";

type blurModeMessages = (typeof messages)[UiLang]["reader"]["blurModeToggle"]

export function BlurModeToggle({
  value,
  onChange,
  msgs,
}: {
  value: BlurMode;
  onChange: (v: BlurMode) => void;
  msgs: blurModeMessages;
}) {
  return (
    <div className="
      flex flex-col items-center 
      overflow-hidden rounded-xl border border-border/70 
      bg-muted/40 shadow-sm
    ">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <MousePointerClick className="h-3 w-3" />
        <span className="font-bold text-[10px]">
          {msgs.header.prefix}{" "}
          <span className="bg-blue-500/20">{msgs.header.highlight}</span>
          {" "}{msgs.header.suffix}
        </span>
      </div>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (!v) return;
          onChange(v as BlurMode);
        }}
        className="grid w-full grid-cols-3 rounded-none border-t border-border/70 bg-background/70"
      >
        <ToggleGroupItem
          value="word"
          className="w-full !rounded-none border-r border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-blue-50 hover:text-foreground data-[state=on]:bg-blue-100 data-[state=on]:text-foreground first:!rounded-none last:!rounded-none"
        >
          {msgs.word}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="sentence"
          className="w-full !rounded-none border-r border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-blue-50 hover:text-foreground data-[state=on]:bg-blue-100 data-[state=on]:text-foreground first:!rounded-none last:!rounded-none"
        >
          {msgs.sentence}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="paragraph"
          className="w-full !rounded-none px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-blue-50 hover:text-foreground data-[state=on]:bg-blue-100 data-[state=on]:text-foreground first:!rounded-none last:!rounded-none"
        >
          {msgs.paragraph}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
