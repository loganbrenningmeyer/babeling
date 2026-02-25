import type { LibraryTranslation } from "../types/translation";

/**************************
 * `getMostRecentTranslation()`
 * -- Returns the most recently opened translation from a list of LibraryTranslations
 **************************/
export function getMostRecentTranslation(
  translations: LibraryTranslation[]
): LibraryTranslation | null {
  return translations
    .filter((t) => t.lastOpenedAt)
    .reduce<LibraryTranslation | null>((latest, t) => {
      if (!latest) return t;
      return new Date(t.lastOpenedAt!).getTime() > new Date(latest.lastOpenedAt!).getTime()
        ? t
        : latest;
    }, null);
}
