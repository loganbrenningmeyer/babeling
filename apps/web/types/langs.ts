import { toUiLang } from "@/app/i18n/messages";

export const LANG_COLOR_BY_CODE = {
  en: {
    bg: "bg-blue-50 dark:bg-blue-500/15",
    chip: "bg-blue-600 text-white border-blue-700 dark:bg-blue-400 dark:text-blue-950 dark:border-blue-300",
    hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    accent: "bg-blue-600/40 dark:bg-blue-400/18",
    border: "border-blue-700/40 dark:border-blue-400/35",
    focusBorder: "focus-visible:border-blue-700/40 dark:focus-visible:border-blue-400/35",
    hoverBorder:
      "group-hover/doc-front:border-blue-700/40 group-focus-visible/doc-front:border-blue-700/40 dark:group-hover/doc-front:border-blue-400/35 dark:group-focus-visible/doc-front:border-blue-400/35",
    glossaryHoverBorder:
      "group-hover/gloss-front:border-blue-700/40 group-focus-visible/gloss-front:border-blue-700/40 dark:group-hover/gloss-front:border-blue-400/35 dark:group-focus-visible/gloss-front:border-blue-400/35",
    stroke: "stroke-blue-700 dark:stroke-blue-300",
    progress: "bg-blue-700 dark:bg-blue-400",
    highlight: "bg-blue-400/20 hover:bg-blue-400/20 dark:bg-blue-400/20 dark:hover:bg-blue-400/20",
  },
  fr: {
    bg: "bg-rose-50 dark:bg-rose-500/15",
    chip: "bg-rose-600 text-white border-rose-700 dark:bg-rose-400 dark:text-rose-950 dark:border-rose-300",
    hoverBg: "hover:bg-rose-50 dark:hover:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-300",
    accent: "bg-rose-600/40 dark:bg-rose-400/18",
    border: "border-rose-700/40 dark:border-rose-400/35",
    focusBorder: "focus-visible:border-rose-700/40 dark:focus-visible:border-rose-400/35",
    hoverBorder:
      "group-hover/doc-front:border-rose-700/40 group-focus-visible/doc-front:border-rose-700/40 dark:group-hover/doc-front:border-rose-400/35 dark:group-focus-visible/doc-front:border-rose-400/35",
    glossaryHoverBorder:
      "group-hover/gloss-front:border-rose-700/40 group-focus-visible/gloss-front:border-rose-700/40 dark:group-hover/gloss-front:border-rose-400/35 dark:group-focus-visible/gloss-front:border-rose-400/35",
    stroke: "stroke-rose-700 dark:stroke-rose-300",
    progress: "bg-rose-700 dark:bg-rose-400",
    highlight: "bg-rose-400/20 hover:bg-rose-400/20 dark:bg-rose-400/20 dark:hover:bg-rose-400/20",
  },
  es: {
    bg: "bg-amber-50 dark:bg-amber-500/15",
    chip: "bg-amber-700 text-white border-amber-800 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-300",
    hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-300",
    accent: "bg-amber-600/40 dark:bg-amber-400/18",
    border: "border-amber-700/40 dark:border-amber-400/35",
    focusBorder: "focus-visible:border-amber-700/40 dark:focus-visible:border-amber-400/35",
    hoverBorder:
      "group-hover/doc-front:border-amber-700/40 group-focus-visible/doc-front:border-amber-700/40 dark:group-hover/doc-front:border-amber-400/35 dark:group-focus-visible/doc-front:border-amber-400/35",
    glossaryHoverBorder:
      "group-hover/gloss-front:border-amber-700/40 group-focus-visible/gloss-front:border-amber-700/40 dark:group-hover/gloss-front:border-amber-400/35 dark:group-focus-visible/gloss-front:border-amber-400/35",
    stroke: "stroke-amber-600 dark:stroke-amber-300",
    progress: "bg-amber-600 dark:bg-amber-400",
    highlight: "bg-amber-400/20 hover:bg-amber-400/20 dark:bg-amber-400/20 dark:hover:bg-amber-400/20",
  },
  it: {
    bg: "bg-emerald-50 dark:bg-emerald-500/15",
    chip: "bg-emerald-700 text-white border-emerald-800 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-300",
    hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    accent: "bg-emerald-600/40 dark:bg-emerald-400/18",
    border: "border-emerald-700/40 dark:border-emerald-400/35",
    focusBorder: "focus-visible:border-emerald-700/40 dark:focus-visible:border-emerald-400/35",
    hoverBorder:
      "group-hover/doc-front:border-emerald-700/40 group-focus-visible/doc-front:border-emerald-700/40 dark:group-hover/doc-front:border-emerald-400/35 dark:group-focus-visible/doc-front:border-emerald-400/35",
    glossaryHoverBorder:
      "group-hover/gloss-front:border-emerald-700/40 group-focus-visible/gloss-front:border-emerald-700/40 dark:group-hover/gloss-front:border-emerald-400/35 dark:group-focus-visible/gloss-front:border-emerald-400/35",
    stroke: "stroke-emerald-700 dark:stroke-emerald-300",
    progress: "bg-emerald-700 dark:bg-emerald-400",
    highlight: "bg-emerald-400/20 hover:bg-emerald-400/20 dark:bg-emerald-400/20 dark:hover:bg-emerald-400/20",
  },
  de: {
    bg: "bg-violet-50 dark:bg-violet-500/15",
    chip: "bg-violet-600 text-white border-violet-700 dark:bg-violet-400 dark:text-violet-950 dark:border-violet-300",
    hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-500/15",
    text: "text-violet-700 dark:text-violet-300",
    accent: "bg-violet-600/40 dark:bg-violet-400/18",
    border: "border-violet-700/40 dark:border-violet-400/35",
    focusBorder: "focus-visible:border-violet-700/40 dark:focus-visible:border-violet-400/35",
    hoverBorder:
      "group-hover/doc-front:border-violet-700/40 group-focus-visible/doc-front:border-violet-700/40 dark:group-hover/doc-front:border-violet-400/35 dark:group-focus-visible/doc-front:border-violet-400/35",
    glossaryHoverBorder:
      "group-hover/gloss-front:border-violet-700/40 group-focus-visible/gloss-front:border-violet-700/40 dark:group-hover/gloss-front:border-violet-400/35 dark:group-focus-visible/gloss-front:border-violet-400/35",
    stroke: "stroke-violet-700 dark:stroke-violet-300",
    progress: "bg-violet-700 dark:bg-violet-400",
    highlight: "bg-violet-400/20 hover:bg-violet-400/20 dark:bg-violet-400/20 dark:hover:bg-violet-400/20",
  },
} as const;

const FALLBACK_LANG_SELECT_COLORS = {
  border: "border-foreground/20",
  chip: "bg-foreground text-background border-foreground",
  focusBorder: "focus-visible:border-foreground/20 dark:focus-visible:border-foreground/20",
  bg: "bg-background/20",
  hoverBg: "hover:bg-background/20 dark:hover:bg-background/20",
  text: "text-foreground",
};

/**************************
 * `getLangSelectColors()`
 * -- Border / background classes used by any control that represents a
 *    language choice (source & target selects, language filter buttons)
 **************************/
export function getLangSelectColors(lang: string) {
  const colors = LANG_COLOR_BY_CODE[toUiLang(lang)];
  if (!colors) return FALLBACK_LANG_SELECT_COLORS;

  return {
    border: colors.border,
    chip: colors.chip,
    focusBorder: colors.focusBorder,
    bg: colors.bg,
    hoverBg: colors.hoverBg,
    text: colors.text,
  };
}
