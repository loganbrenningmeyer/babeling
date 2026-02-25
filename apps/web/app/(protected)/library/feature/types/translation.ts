export type LibraryTranslation = {
  pageTranslationId: number;
  tgtText: string;
  tgtLang: string;
  lastOpenedAt: string | null;
  completedPercent: number;
  currentPageNumber: number;
};

export type LibraryTranslationResponse = {
  translations: LibraryTranslation[];
};

export type LibraryTranslationDTO = {
  page_translation_id: number;
  tgt_text: string;
  tgt_lang: string;
  last_opened_at: string | null;
  completed_percent: number;
  current_page_number: number;
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
    completedPercent: dto.completed_percent,
    currentPageNumber: dto.current_page_number,
  };
}

export function fromLibraryTranslationResponseDTO(
  dto: LibraryTranslationResponseDTO
): LibraryTranslationResponse {
  return {
    translations: dto.translations.map(fromLibraryTranslationDTO),
  };
}