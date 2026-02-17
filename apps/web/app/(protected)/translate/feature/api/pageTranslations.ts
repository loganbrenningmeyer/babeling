import type { SavedPageTranslation, AlignmentData } from "../types";

type PageTranslationResponse = {
  page_translation: SavedPageTranslation | null;
};

// -------------------------
// POST: /api/page_translations
// -- Fetch saved page translation
// -------------------------
export async function getPageTranslation({
  documentPageId,
  srcLang,
  tgtLang,
}: {
  documentPageId: number;
  srcLang: string;
  tgtLang: string;
}): Promise<SavedPageTranslation | null> {
  // -------------------------
  // Set GET URL params
  // -------------------------
  const params = new URLSearchParams({
    document_page_id: String(documentPageId),
    src_lang: srcLang,
    tgt_lang: tgtLang,
  });

  const res = await fetch(`/api/page_translations?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data: PageTranslationResponse = await res.json();
  if (!res.ok) throw new Error("Failed to load page translation");
  return data.page_translation;
}

// -------------------------
// POST: /api/page_translations
// -- Save page translation
// -------------------------
export async function savePageTranslation({
  documentPageId,
  srcLang,
  tgtLang,
  translatedText,
  alignmentData,
}: {
  documentPageId: number;
  srcLang: string;
  tgtLang: string;
  translatedText: string;
  alignmentData: AlignmentData;
}): Promise<SavedPageTranslation> {
  const res = await fetch("/api/page_translations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_page_id: documentPageId,
      src_lang: srcLang,
      tgt_lang: tgtLang,
      translated_text: translatedText,
      alignment_data: alignmentData,
    }),
  });

  const data: PageTranslationResponse = await res.json();

  if (!res.ok || !data.page_translation) {
    throw new Error("Failed to save page translation");
  }
  
  return data.page_translation;
}
