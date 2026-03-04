import { cn } from "@/lib/utils";

import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { LangLabels, toUiLang } from "../i18n/messages";

export function LangBadge({ 
  lang,
  labels,
  useLabel,
  className,
}: { 
  lang: string,
  labels?: LangLabels,
  useLabel?: boolean,
  className?: string, 
}) {
  const langColors = LANG_COLOR_BY_CODE[lang as keyof typeof LANG_COLOR_BY_CODE] ?? {
    bg: "bg-muted/60",
    text: "text-muted-foreground",
    accent: "bg-muted",
    border: "border-border",
  };

  const text = (useLabel && labels) ? labels[toUiLang(lang)] : lang.toUpperCase();

  return (
    <div 
      className={cn(`
          flex items-center justify-center
          ${langColors.bg} ${langColors.text} 
          border ${langColors.border}
          rounded-md text-xs font-semibold font-ui
          py-0.5 px-2
        `,
        className,
      )}
    >
      {text}
    </div>
  )
}
