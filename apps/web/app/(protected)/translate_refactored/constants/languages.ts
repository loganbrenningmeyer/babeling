export const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
] as const;

export type SupportedLang = (typeof LANGS)[number]["code"];

export function getLangLabel(code: string) {
  return LANGS.find((lang) => lang.code === code)?.label ?? code;
}
