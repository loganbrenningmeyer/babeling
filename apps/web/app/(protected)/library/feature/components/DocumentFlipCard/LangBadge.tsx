import { LANG_COLOR_BY_CODE } from "@/types/langs";

export function LangBadge({ lang }: { lang: string }) {
  const langColors = LANG_COLOR_BY_CODE[lang as keyof typeof LANG_COLOR_BY_CODE] ?? {
    bg: "bg-zinc-500/15",
    text: "text-zinc-700",
    accent: "bg-zinc-500/40",
    border: "border-zinc-700/60",
  };

  return (
    <div className={`
      ${langColors.bg} ${langColors.text} 
      border ${langColors.border}
      rounded-md text-xs font-semibold 
      py-0.5 px-2
    `}>
      {lang.toUpperCase()}
    </div>
  )
}