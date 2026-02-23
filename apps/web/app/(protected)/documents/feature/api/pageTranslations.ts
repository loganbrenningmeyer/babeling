import type { AlignmentPayload, PageTranslation, PageTranslationResponseDTO } from "../types/pageTranslation";

/**************************
 * `getPageTranslation()`
 * -- GET: /api/page_translations
 *    - Fetches saved page translation data for document page ID / src/tgtLang combination
 **************************/
export async function getPageTranslation(args: {
  documentPageId: number;
  srcLang: string;
  tgtLang: string;
}): Promise<PageTranslation | null> {
  const params = new URLSearchParams({
    document_page_id: String(args.documentPageId),
    src_lang: args.srcLang,
    tgt_lang: args.tgtLang,
  });

  const res = await fetch(`/api/page_translations?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (res.status === 404) return null;

  if (!res.ok) { 
    throw new Error("Failed to load page translation");
  }

  const data = (await res.json()) as PageTranslationResponseDTO;
  const page_translation = data.page_translation;

  // No translation found, create a new one
  if (!page_translation) return null;

  return {
    id: page_translation.id,
    documentPageId: page_translation.document_page_id,
    srcLang: page_translation.src_lang,
    tgtLang: page_translation.tgt_lang,
    translatedText: page_translation.translated_text,
    alignmentData: page_translation.alignment_data,
  };
}


/**************************
 * `savePageTranslation()`
 * -- POST: /api/page_translations
 *    - Saves page translation data to the database and returns the saved info
 **************************/
export async function savePageTranslation(args: {
  documentPageId: number;
  srcLang: string;
  tgtLang: string;
  translatedText: string;
  alignmentData: AlignmentPayload;
}): Promise<PageTranslation> {
  const {
    documentPageId,
    srcLang,
    tgtLang,
    translatedText,
    alignmentData,
  } = args;

  const res = await fetch("/api/page_translations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_page_id: documentPageId,
      src_lang: srcLang,
      tgt_lang: tgtLang,
      translated_text: translatedText,
      alignment_data: alignmentData,
    })
  });

  if (!res.ok) { 
    throw new Error("Failed to load page translation");
  }

  const data = (await res.json()) as PageTranslationResponseDTO;
  const page_translation = data.page_translation;

  if (!page_translation) {
    throw new Error("Failed to load page translation");
  }

  return {
    id: page_translation.id,
    documentPageId: page_translation.document_page_id,
    srcLang: page_translation.src_lang,
    tgtLang: page_translation.tgt_lang,
    translatedText: page_translation.translated_text,
    alignmentData: page_translation.alignment_data,
  };
}