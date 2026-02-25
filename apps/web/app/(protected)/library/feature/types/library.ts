import { GlossaryDefinition, GlossaryUsage, GlossaryDefinitionDTO, GlossaryUsageDTO } from "@/app/(protected)/documents/feature/types/glossaryItem";

// -------------------------
// Documents
// -------------------------
export type LibraryDocument = {
  id: number;
  title: string;
  srcText: string;
  srcLang: string;
  lastOpenedAt: string | null;
  latestTgtLang: string | null;
};

export type LibraryDocumentResponse = {
  documents: LibraryDocument[];
};

export type LibraryDocumentDTO = {
  id: number;
  title: string;
  src_text: string;
  src_lang: string;
  last_opened_at: string | null;
  latest_tgt_lang: string | null;
}

export type LibraryDocumentResponseDTO = {
  documents: LibraryDocumentDTO[];
}

export function fromLibraryDocumentDTO(
  dto: LibraryDocumentDTO
): LibraryDocument {
  return {
    id: dto.id,
    title: dto.title,
    srcText: dto.src_text,
    srcLang: dto.src_lang,
    lastOpenedAt: dto.last_opened_at,
    latestTgtLang: dto.latest_tgt_lang,
  }
}

export function fromLibraryDocumentResponseDTO(
  dto: LibraryDocumentResponseDTO
): LibraryDocumentResponse {
  return {
    documents: dto.documents.map(fromLibraryDocumentDTO),
  }
}

// -------------------------
// Glossary Items
// -------------------------
export type LibraryGlossaryItem = {
  srcLang: string;
  tgtLang: string;
  definition: GlossaryDefinition;
  usage: GlossaryUsage;
  createdAt: string;
}

export type LibraryGlossaryItemResponse = {
  glossaryItems: LibraryGlossaryItem[];
}

export type LibraryGlossaryItemDTO = {
  src_lang: string;
  tgt_lang: string;
  definition: GlossaryDefinitionDTO;
  usage: GlossaryUsageDTO;
  created_at: string;
}

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