import { LANG_COLOR_BY_CODE } from "@/types/langs";


export function getLangColors(lang: string) {
  return LANG_COLOR_BY_CODE[lang as keyof typeof LANG_COLOR_BY_CODE];
}