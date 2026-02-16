export const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
];

export const LANG_BADGE_COLOR_BY_CODE: Record<string, string> = {
  en: "bg-blue-500/15 text-blue-700",
  fr: "bg-rose-500/15 text-rose-700",
  es: "bg-amber-500/15 text-amber-700",
  it: "bg-emerald-500/15 text-emerald-700",
  de: "bg-violet-500/15 text-violet-700",
};

export function getLangLabel(code: string) {
  return LANGS.find((l) => l.code === code)?.label ?? code;
}
