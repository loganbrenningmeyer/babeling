import {
  GlossaryItemDefinition,
  GlossaryItemUsage,
  GlossaryItemDefinitionDTO,
  GlossaryItemUsageDTO,
  fromGlossaryContextAlignmentDTO,
} from "@/app/(protected)/documents/feature/types/glossaryItem";

export type LibraryGlossaryItem = {
  glossaryItemId: number;
  documentTitle: string;
  srcLang: string;
  tgtLang: string;
  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
  createdAt: string;
};

export type LibraryGlossaryItemsResponse = {
  glossaryItems: LibraryGlossaryItem[];
};

export type LibraryGlossaryItemDTO = {
  glossary_item_id: number;
  document_title: string;
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryItemDefinitionDTO;
  usage: GlossaryItemUsageDTO;
  created_at: string;
};

export type LibraryGlossaryItemsResponseDTO = {
  glossary_items: LibraryGlossaryItemDTO[];
};

export function fromLibraryGlossaryItemDTO(
  dto: LibraryGlossaryItemDTO
): LibraryGlossaryItem {
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
    usage: dto.usage,
    createdAt: dto.created_at,
  };
}

export function fromLibraryGlossaryItemsResponseDTO(
  dto: LibraryGlossaryItemsResponseDTO
): LibraryGlossaryItemsResponse {
  return {
    glossaryItems: dto.glossary_items.map(fromLibraryGlossaryItemDTO),
  };
}
