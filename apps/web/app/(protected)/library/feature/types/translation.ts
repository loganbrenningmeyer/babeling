export type LibraryTranslation = {
  pageTranslationId: number;
  tgtText: string;
  tgtLang: string;
  lastOpenedAt: string | null;
  completionPercent: number;
  currentPageNumber: number;
  totalPages: number;
};

export type LibraryTranslationResponse = {
  translations: LibraryTranslation[];
};

export type LibraryTranslationDTO = {
  page_translation_id: number;
  tgt_text: string;
  tgt_lang: string;
  last_opened_at: string | null;
  completion_percent: number;
  current_page_number: number;
  total_pages: number;
};

export type LibraryTranslationResponseDTO = {
  translations: LibraryTranslationDTO[];
};

export function fromLibraryTranslationDTO(
  dto: LibraryTranslationDTO
): LibraryTranslation {
  return {
    pageTranslationId: dto.page_translation_id,
    tgtText: dto.tgt_text,
    tgtLang: dto.tgt_lang,
    lastOpenedAt: dto.last_opened_at,
    completionPercent: dto.completion_percent,
    currentPageNumber: dto.current_page_number,
    totalPages: dto.total_pages,
  };
}

export function fromLibraryTranslationResponseDTO(
  dto: LibraryTranslationResponseDTO
): LibraryTranslationResponse {
  return {
    translations: dto.translations.map(fromLibraryTranslationDTO),
  };
}