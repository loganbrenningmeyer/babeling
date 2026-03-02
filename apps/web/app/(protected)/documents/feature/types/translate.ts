// -------------------------
// Frontend
// -------------------------
export type TranslateSentence = {
  sentId: number;
  source: string;
  target: string;
};

export type TranslateParagraph = {
  parId: number;
  sentences: TranslateSentence[];
};

export type TranslateResponse = {
  sourceText: string;
  targetText: string;
  paragraphs: TranslateParagraph[];
};

// -------------------------
// Backend
// -------------------------
export type TranslateSentenceDTO = {
  sent_id: number;
  source: string;
  target: string;
};

export type TranslateParagraphDTO = {
  par_id: number;
  sentences: TranslateSentenceDTO[];
};

export type TranslateResponseDTO = {
  source_text: string;
  target_text: string;
  paragraphs: TranslateParagraphDTO[];
};