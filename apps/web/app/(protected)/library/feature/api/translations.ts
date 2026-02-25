import {
  LibraryTranslationResponse,
  LibraryTranslationResponseDTO,
  fromLibraryTranslationResponseDTO,
} from "../types/translation";

/**************************
 * `getRecentTranslations()`
 * -- Fetches recent translations for given documentId
 **************************/
export async function getRecentTranslations(args: {
  documentId: number;
  limit?: number | null;
}): Promise<LibraryTranslationResponse> {
  const { documentId } = args;
  const limit = args.limit ?? null;

  const res = await fetch(
    `/api/library/documents/${encodeURIComponent(String(documentId))}/translations`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load document translations");
  }

  const { translations } = fromLibraryTranslationResponseDTO(
    data as LibraryTranslationResponseDTO
  );

  translations.sort((a, b) => {
    const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
    const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
    return tb - ta;
  });

  return {
    translations: limit == null ? translations : translations.slice(0, limit),
  };
}
