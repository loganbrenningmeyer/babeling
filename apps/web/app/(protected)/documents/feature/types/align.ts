import type { AlignmentPayload } from "./pageTranslation"
import type { TranslateSentence, TranslateSentenceDTO, TranslateParagraph, TranslateParagraphDTO } from "./translate";

// -------------------------
// Frontend
// -------------------------
export type AlignRequest = {
  paragraphs: TranslateParagraph[];
  srcLang: string;
  tgtLang: string;
};

// -------------------------
// Backend return type
// -------------------------
export type AlignResponseDTO = {
  src: AlignmentPayload["src"];
  tgt: AlignmentPayload["tgt"];
  align: AlignmentPayload["align"];
};

export function toSentenceDTO(sent: TranslateSentence): TranslateSentenceDTO {
  return {
    sent_id: sent.sentId,
    source: sent.source,
    target: sent.target,
  };
}

export function toParagraphDTO(par: TranslateParagraph): TranslateParagraphDTO {
  return {
    par_id: par.parId,
    sentences: par.sentences.map(toSentenceDTO),
  };
}

export function toParagraphsDTO(
  paragraphs: TranslateParagraph[]
): TranslateParagraphDTO[] {
  return paragraphs.map(toParagraphDTO);
}