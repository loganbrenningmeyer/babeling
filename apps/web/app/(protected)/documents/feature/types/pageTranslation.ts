// -------------------------
// Frontend types
// -------------------------
export type TokenBlock = {
  words: string[];
  spaces: string[];
  sentIds: number[];
  parIds: number[];
  sentToParIds: Record<number, number>;
  sentToWordIds: Record<number, number[]>;
  parToSentIds: Record<number, number[]>;
  parToWordIds: Record<number, number[]>;
};

export type AlignmentMap = {
  srcToTgt: Record<number, number[]>;
  tgtToSrc: Record<number, number[]>;
};

export type AlignmentPayload = {
  src: TokenBlock;
  tgt: TokenBlock;
  align: AlignmentMap;
};

export type PageTranslation = {
  id: number;
  documentPageId: number;
  srcLang: string;
  tgtLang: string;
  translatedText: string;
  alignmentData: AlignmentPayload;
}

// -------------------------
// Backend return types
// -------------------------
export type PageTranslationDTO = {
  id: number;
  document_page_id: number;
  src_lang: string;
  tgt_lang: string;
  translated_text: string;
  alignment_data: AlignmentPayload;
}

export type PageTranslationResponseDTO = {
  page_translation: PageTranslationDTO | null;
}