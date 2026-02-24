// -------------------------
// Frontend return types
// -------------------------
export type GlossaryExample = {
  source: string;
  target: string;
}

export type GlossaryDefinition = {
  // Clicked word
  form: string;
  posForm: string | null;
  ipaForm: string | null;

  // Lemma
  lemma: string | null;
  posLemma: string | null;
  ipaLemma: string | null;

  // Meaning
  gloss: string;

  // Context
  srcSentence: string;
  srcParagraph: string;
  tgtSentence: string;
  tgtParagraph: string;

  // Location in document/page/tokenized text
  documentId: number;
  pageId: number;
  parId: number;
  sentId: number;
  wordId: number;
};

export type GlossaryUsage = {
  explanation: string;
  examples: GlossaryExample[];
};

export type GlossarySaveRequest = {
  srcLang: string;
  tgtLang: string;
  definition: GlossaryDefinition;
  usage: GlossaryUsage;
};

export type GlossarySaveResponse = {
  glossaryItemId: number;
  alreadyExists: boolean;
};

export type GlossaryLoadResponse = {
  srcLang: string;
  tgtLang: string;
  definition: GlossaryDefinition;
  usage: GlossaryUsage;
};

export type GlossaryDeleteResponse = {
  glossaryItemId: number;
  ok: boolean;
}

// -------------------------
// Backend return types
// -------------------------
export type GlossaryExampleDTO = {
  source: string;
  target: string;
};

export type GlossaryDefinitionDTO = {
  form: string;
  pos_form: string | null;
  ipa_form: string | null;

  lemma: string | null;
  pos_lemma: string | null;
  ipa_lemma: string | null;

  gloss: string;

  src_sentence: string;
  src_paragraph: string;
  tgt_sentence: string;
  tgt_paragraph: string;

  document_id: number;
  page_id: number;
  par_id: number;
  sent_id: number;
  word_id: number;
};

export type GlossaryUsageDTO = {
  explanation: string;
  examples: GlossaryExampleDTO[];
};

export type GlossarySaveRequestDTO = {
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryDefinitionDTO;
  usage: GlossaryUsageDTO;
};

export type GlossarySaveResponseDTO = {
  glossary_item_id: number;
  already_exists: boolean;
};

export type GlossaryLoadResponseDTO = {
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryDefinitionDTO;
  usage: GlossaryUsageDTO;
};

export type GlossaryDeleteResponseDTO = {
  glossary_item_id: number;
  ok: boolean;
}

// -------------------------
// Frontend <-> Backend (DTO) Mapping Functions
// -------------------------
export function toGlossarySaveRequestDTO(
  req: GlossarySaveRequest
): GlossarySaveRequestDTO {
  return {
    src_lang: req.srcLang,
    tgt_lang: req.tgtLang,
    definition: {
      form: req.definition.form,
      pos_form: req.definition.posForm,
      ipa_form: req.definition.ipaForm,
      lemma: req.definition.lemma,
      pos_lemma: req.definition.posLemma,
      ipa_lemma: req.definition.ipaLemma,
      gloss: req.definition.gloss,
      src_sentence: req.definition.srcSentence,
      src_paragraph: req.definition.srcParagraph,
      tgt_sentence: req.definition.tgtSentence,
      tgt_paragraph: req.definition.tgtParagraph,
      document_id: req.definition.documentId,
      page_id: req.definition.pageId,
      par_id: req.definition.parId,
      sent_id: req.definition.sentId,
      word_id: req.definition.wordId,
    },
    usage: req.usage,
  };
}

export function fromGlossarySaveResponseDTO(
  dto: GlossarySaveResponseDTO
): GlossarySaveResponse {
  return {
    glossaryItemId: dto.glossary_item_id,
    alreadyExists: dto.already_exists,
  };
}

export function fromGlossaryLoadResponseDTO(
  dto: GlossaryLoadResponseDTO
): GlossaryLoadResponse {
  return {
    srcLang: dto.src_lang,
    tgtLang: dto.tgt_lang,
    definition: {
      form: dto.definition.form,
      posForm: dto.definition.pos_form,
      ipaForm: dto.definition.ipa_form,
      lemma: dto.definition.lemma,
      posLemma: dto.definition.pos_lemma,
      ipaLemma: dto.definition.ipa_lemma,
      gloss: dto.definition.gloss,
      srcSentence: dto.definition.src_sentence,
      srcParagraph: dto.definition.src_paragraph,
      tgtSentence: dto.definition.tgt_sentence,
      tgtParagraph: dto.definition.tgt_paragraph,
      documentId: dto.definition.document_id,
      pageId: dto.definition.page_id,
      parId: dto.definition.par_id,
      sentId: dto.definition.sent_id,
      wordId: dto.definition.word_id,
    },
    usage: dto.usage,
  };
}

export function fromGlossaryDeleteResponseDTO(
  dto: GlossaryDeleteResponseDTO
): GlossaryDeleteResponse {
  return {
    glossaryItemId: dto.glossary_item_id,
    ok: dto.ok,
  };
}