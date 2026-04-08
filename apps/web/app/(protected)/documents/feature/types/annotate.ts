import { ReaderSession } from "./readerSession";
import { DefineEntry, ExplainEntry } from "../components/Annotate/AnnotateCard";

// -------------------------
// Frontend return types
// -------------------------
export type AnnotateDomainData = {
  words: string[];
  spaces: string[];
  sentIds: number[];
  parIds: number[];
};

export type AnnotateDefinitionData = {
  form: string;
  posForm: string;
  ipaForm: string;

  lemma: string;
  posLemma: string;
  ipaLemma: string;

  gloss: string;

  srcSentence: string;
  srcParagraph: string;
  tgtSentence: string;
  tgtParagraph: string;
};

export type AnnotateExample = {
  source: string;
  target: string;
};

export type AnnotateUsageData = {
  explanation: string;
  examples: AnnotateExample[];
};

export type AnnotateResponse = {
  definition: AnnotateDefinitionData;
  usage: AnnotateUsageData;
}

// -------------------------
// Backend return types
// -------------------------
export type AnnotateDomainDataDTO = {
  words: string[];
  spaces: string[];
  sent_ids: number[];
  par_ids: number[];
};

export type AnnotateDefinitionDataDTO = {
  form: string;
  pos_form: string;
  ipa_form: string;

  lemma: string;
  pos_lemma: string;
  ipa_lemma: string;

  gloss: string;

  src_sentence: string;
  src_paragraph: string;
  tgt_sentence: string;
  tgt_paragraph: string;
};

export type AnnotateUsageDataDTO = {
  explanation: string;
  examples: AnnotateExample[];
};

export type AnnotateResponseDTO = {
  definition: AnnotateDefinitionDataDTO;
  usage: AnnotateUsageDataDTO;
};

export type AnnotateRequestDTO = {
  src_lang: string;
  tgt_lang: string;
  ui_lang: string;

  src: AnnotateDomainDataDTO;
  tgt: AnnotateDomainDataDTO;

  tgt_to_src: Record<number, number[]> | Record<string, number[]>;
  tgt_idx: number;
}

// =========================
// ( Annotate Function Helpers )
// -- AnnotateArgs: Defines annotate() API call args
// -- makeAnnotateArgs(): Converts inputs to AnnotateArgs
// -- toAnnotateEntries(): Converts annotate() API call response to DefineEntry / ExplainEntry
// =========================
export type AnnotateArgs = {
  srcLang: string;
  tgtLang: string;
  uiLang: string;

  src: AnnotateDomainData;
  tgt: AnnotateDomainData;

  tgtToSrc: Record<number, number[]>;
  tgtIdx: number;
};

export function makeAnnotateArgs(args: {
  session: ReaderSession;
  srcLang: string;
  tgtLang: string;
  uiLang: string;
  tgtIdx: number;
  isSwapped: boolean;
}): AnnotateArgs {
  const { session, srcLang, tgtLang, uiLang, tgtIdx, isSwapped } = args;

  const srcBlock = isSwapped ? session.alignment.tgt : session.alignment.src;
  const tgtBlock = isSwapped ? session.alignment.src : session.alignment.tgt;
  const targetToSourceMap = isSwapped
    ? session.alignment.align.srcToTgt
    : session.alignment.align.tgtToSrc;

  return {
    srcLang: isSwapped ? tgtLang : srcLang,
    tgtLang: isSwapped ? srcLang : tgtLang,
    uiLang,
    src: {
      words: srcBlock.words,
      spaces: srcBlock.spaces,
      sentIds: srcBlock.sentIds,
      parIds: srcBlock.parIds,
    },
    tgt: {
      words: tgtBlock.words,
      spaces: tgtBlock.spaces,
      sentIds: tgtBlock.sentIds,
      parIds: tgtBlock.parIds,
    },
    tgtToSrc: targetToSourceMap,
    tgtIdx,
  };
}

export function toAnnotateEntries(res: AnnotateResponse): {
  explainData: ExplainEntry;
  defineData: DefineEntry;
} {
  return {
    explainData: {
      explanation: res.usage.explanation,
      examples: res.usage.examples,
    },
    defineData: {
      form: res.definition.form,
      posForm: res.definition.posForm,
      ipaForm: res.definition.ipaForm,

      lemma: res.definition.lemma,
      posLemma: res.definition.posLemma,
      ipaLemma: res.definition.ipaLemma,

      gloss: res.definition.gloss,

      srcSentence: res.definition.srcSentence,
      srcParagraph: res.definition.srcParagraph,
      tgtSentence: res.definition.tgtSentence,
      tgtParagraph: res.definition.tgtParagraph,
    },
  };
}
