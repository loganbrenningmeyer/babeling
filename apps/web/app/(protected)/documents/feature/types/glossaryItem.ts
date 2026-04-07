// -------------------------
// Frontend return types
// -------------------------
export type GlossaryContextTokenSlice = {
  words: string[];
  spaces: string[];
  globalWordIds: number[];
  highlightedLocalWordIds: number[];
};

export type GlossaryContextAlignment = {
  sentence: {
    src: GlossaryContextTokenSlice;
    tgt: GlossaryContextTokenSlice;
  };
  paragraph: {
    src: GlossaryContextTokenSlice;
    tgt: GlossaryContextTokenSlice;
  };
};

export type GlossaryContextTokenSliceDTO = {
  words: string[];
  spaces: string[];
  global_word_ids: number[];
  highlighted_local_word_ids: number[];
};

export type GlossaryContextPairDTO = {
  src: GlossaryContextTokenSliceDTO;
  tgt: GlossaryContextTokenSliceDTO;
};

export type GlossaryContextAlignmentDTO = {
  sentence: GlossaryContextPairDTO;
  paragraph: GlossaryContextPairDTO;
};

export type GlossaryItemExample = {
  source: string;
  target: string;
}

export type GlossaryItemDefinition = {
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
  contextAlignment: GlossaryContextAlignment;

  // Location in document/page/tokenized text
  documentId: number;
  pageId: number;
  parId: number;
  sentId: number;
  wordId: number;
};

export type GlossaryItemUsage = {
  contextMeaning: string | null;
  explanation: string;
  examples: GlossaryItemExample[];
};

export type GlossaryItemSaveRequest = {
  srcLang: string;
  tgtLang: string;
  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
};

export type GlossaryItemSaveResponse = {
  glossaryItemId: number;
  alreadyExists: boolean;
};

export type GlossaryItemLoadResponse = {
  glossaryItemId: number;
  documentTitle: string;
  srcLang: string;
  tgtLang: string;
  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
  createdAt: string;
};

export type GlossaryItemsLoadResponse = {
  glossaryItems: GlossaryItemLoadResponse[];
}

export type GlossaryItemDeleteResponse = {
  glossaryItemId: number;
  ok: boolean;
}

// -------------------------
// Backend return types
// -------------------------
export type GlossaryItemExampleDTO = {
  source: string;
  target: string;
};

export type GlossaryItemDefinitionDTO = {
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
  context_alignment: GlossaryContextAlignmentDTO;

  document_id: number;
  page_id: number;
  par_id: number;
  sent_id: number;
  word_id: number;
};

export type GlossaryItemUsageDTO = {
  context_meaning: string | null;
  explanation: string;
  examples: GlossaryItemExampleDTO[];
};

export type GlossaryItemSaveRequestDTO = {
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryItemDefinitionDTO;
  usage: GlossaryItemUsageDTO;
};

export type GlossaryItemSaveResponseDTO = {
  glossary_item_id: number;
  already_exists: boolean;
};

export type GlossaryItemLoadResponseDTO = {
  glossary_item_id: number;
  document_title: string;
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryItemDefinitionDTO;
  usage: GlossaryItemUsageDTO;
  created_at: string;
};

export type GlossaryItemsLoadResponseDTO = {
  glossary_items: GlossaryItemLoadResponseDTO[];
}

export type GlossaryItemDeleteResponseDTO = {
  glossary_item_id: number;
  ok: boolean;
}

// -------------------------
// Frontend <-> Backend (DTO) Mapping Functions
// -------------------------
export function toGlossaryContextTokenSliceDTO(
  ctx: GlossaryContextTokenSlice
): GlossaryContextTokenSliceDTO {
  return {
    words: ctx.words,
    spaces: ctx.spaces,
    global_word_ids: ctx.globalWordIds,
    highlighted_local_word_ids: ctx.highlightedLocalWordIds,
  };
}

export function fromGlossaryContextTokenSliceDTO(
  dto: GlossaryContextTokenSliceDTO
): GlossaryContextTokenSlice {
  return {
    words: dto.words,
    spaces: dto.spaces,
    globalWordIds: dto.global_word_ids,
    highlightedLocalWordIds: dto.highlighted_local_word_ids,
  };
}

export function toGlossaryContextAlignmentDTO(
  ctx: GlossaryContextAlignment
): GlossaryContextAlignmentDTO {
  return {
    sentence: {
      src: toGlossaryContextTokenSliceDTO(ctx.sentence.src),
      tgt: toGlossaryContextTokenSliceDTO(ctx.sentence.tgt),
    },
    paragraph: {
      src: toGlossaryContextTokenSliceDTO(ctx.paragraph.src),
      tgt: toGlossaryContextTokenSliceDTO(ctx.paragraph.tgt),
    },
  };
}

export function fromGlossaryContextAlignmentDTO(
  dto: GlossaryContextAlignmentDTO
): GlossaryContextAlignment {
  return {
    sentence: {
      src: fromGlossaryContextTokenSliceDTO(dto.sentence.src),
      tgt: fromGlossaryContextTokenSliceDTO(dto.sentence.tgt),
    },
    paragraph: {
      src: fromGlossaryContextTokenSliceDTO(dto.paragraph.src),
      tgt: fromGlossaryContextTokenSliceDTO(dto.paragraph.tgt),
    },
  };
}

export function toGlossaryItemSaveRequestDTO(
  req: GlossaryItemSaveRequest
): GlossaryItemSaveRequestDTO {
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
      context_alignment: toGlossaryContextAlignmentDTO(req.definition.contextAlignment),

      document_id: req.definition.documentId,
      page_id: req.definition.pageId,
      par_id: req.definition.parId,
      sent_id: req.definition.sentId,
      word_id: req.definition.wordId,
    },
    usage: {
      context_meaning: req.usage.contextMeaning,
      explanation: req.usage.explanation,
      examples: req.usage.examples,
    },
  };
}

export function fromGlossaryItemSaveResponseDTO(
  dto: GlossaryItemSaveResponseDTO
): GlossaryItemSaveResponse {
  return {
    glossaryItemId: dto.glossary_item_id,
    alreadyExists: dto.already_exists,
  };
}

export function fromGlossaryItemLoadResponseDTO(
  dto: GlossaryItemLoadResponseDTO
): GlossaryItemLoadResponse {
  return {
    glossaryItemId: dto.glossary_item_id,
    documentTitle: dto.document_title,
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
      contextAlignment: fromGlossaryContextAlignmentDTO(dto.definition.context_alignment),
      documentId: dto.definition.document_id,
      pageId: dto.definition.page_id,
      parId: dto.definition.par_id,
      sentId: dto.definition.sent_id,
      wordId: dto.definition.word_id,
    },
    usage: {
      contextMeaning: dto.usage.context_meaning,
      explanation: dto.usage.explanation,
      examples: dto.usage.examples,
    },
    createdAt: dto.created_at,
  };
}

export function fromGlossaryItemsLoadResponseDTO(
  dto: GlossaryItemsLoadResponseDTO
): GlossaryItemsLoadResponse {
  return {
    glossaryItems: dto.glossary_items.map(fromGlossaryItemLoadResponseDTO),
  };
}

export function fromGlossaryItemDeleteResponseDTO(
  dto: GlossaryItemDeleteResponseDTO
): GlossaryItemDeleteResponse {
  return {
    glossaryItemId: dto.glossary_item_id,
    ok: dto.ok,
  };
}
