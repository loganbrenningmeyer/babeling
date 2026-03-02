import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { LangLabels, toUiLang } from "../i18n/messages";

export function LangBadge({ 
  lang,
  labels,
  useLabel,
}: { 
  lang: string,
  labels?: LangLabels,
  useLabel?: boolean, 
}) {
  const langColors = LANG_COLOR_BY_CODE[lang as keyof typeof LANG_COLOR_BY_CODE] ?? {
    bg: "bg-zinc-50",
    text: "text-zinc-700",
    accent: "bg-zinc-500/40",
    border: "border-zinc-700/60",
  };

  const text = (useLabel && labels) ? labels[toUiLang(lang)] : lang.toUpperCase();

  return (
    <div className={`
      ${langColors.bg} ${langColors.text} 
      border ${langColors.border}
      rounded-md text-xs font-semibold 
      py-0.5 px-2
    `}>
      {text}
    </div>
  )
}