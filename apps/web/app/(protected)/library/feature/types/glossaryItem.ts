import {
  GlossaryDefinition,
  GlossaryUsage,
  GlossaryDefinitionDTO,
  GlossaryUsageDTO,
} from "@/app/(protected)/documents/feature/types/glossaryItem";

export type LibraryGlossaryItem = {
  srcLang: string;
  tgtLang: string;
  definition: GlossaryDefinition;
  usage: GlossaryUsage;
  createdAt: string;
};

export type LibraryGlossaryItemResponse = {
  glossaryItems: LibraryGlossaryItem[];
};

export type LibraryGlossaryItemDTO = {
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryDefinitionDTO;
  usage: GlossaryUsageDTO;
  created_at: string;
};

export type LibraryGlossaryItemResponseDTO = {
  glossary_items: LibraryGlossaryItemDTO[];
};

export function fromLibraryGlossaryItemDTO(
  dto: LibraryGlossaryItemDTO
): LibraryGlossaryItem {
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
    createdAt: dto.created_at,
  };
}

export function fromLibraryGlossaryItemResponseDTO(
  dto: LibraryGlossaryItemResponseDTO
): LibraryGlossaryItemResponse {
  return {
    glossaryItems: dto.glossary_items.map(fromLibraryGlossaryItemDTO),
  };
}
