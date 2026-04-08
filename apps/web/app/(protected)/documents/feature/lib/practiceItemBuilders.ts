"use client";

import type { ReaderSession } from "../types/readerSession";
import type { TokenBlock } from "../types/pageTranslation";
import type {
  GlossaryContextAlignment,
  GlossaryContextTokenSlice,
  GlossaryItemSaveRequest,
} from "../types/glossaryItem";
import type { AnnotateResponse } from "../types/annotate";
import type {
  DefineEntry,
  ExplainEntry,
} from "@/app/(protected)/documents/feature/components/Annotate/AnnotateCard";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";


/**************************
 * `makeAnnotationKey()`
 * -- Creates annotation cache key for the session, allowing recovering annotations
 *    without having to save them
 **************************/
export function makeAnnotationKey(args: {
  documentId: number | null;
  pageId: number | null;
  tgtLang: string;
  wordId: number;
}) {
  const { documentId, pageId, tgtLang, wordId } = args;
  return `${documentId ?? "x"}|${pageId ?? "x"}|${tgtLang}|${wordId}`;
}


/**************************
 * `buildContextTokenSlice()`
 * --
 *
 * @param
 * @returns
 **************************/
export function buildContextTokenSlice(args: {
  block: TokenBlock;
  sliceGlobalWordIds: number[];
  highlightedGlobalWordIds: Set<number>;
}): GlossaryContextTokenSlice {
  const { block, sliceGlobalWordIds, highlightedGlobalWordIds } = args;

  // Filter out-of-bounds word IDs
  const ids = sliceGlobalWordIds.filter(
    (i) => i >= 0 && i < block.words.length && i < block.spaces.length
  );

  return {
    words: ids.map((i) => block.words[i]),
    spaces: ids.map((i) => block.spaces[i]),
    globalWordIds: ids,
    highlightedLocalWordIds: ids.reduce<number[]>((acc, globalIdx, localIdx) => {
      if (highlightedGlobalWordIds.has(globalIdx)) acc.push(localIdx);
      return acc;
    }, []),
  };
}


/**************************
 * `buildGlossaryContextAlignment()`
 * --
 *
 * @param
 * @returns
 **************************/
export function buildGlossaryContextAlignment(args: {
  session: ReaderSession;
  tgtIdx: number;
  isSwapped: boolean;
}): GlossaryContextAlignment {
  const { session, tgtIdx, isSwapped } = args;
  const src = isSwapped ? session.alignment.tgt : session.alignment.src;
  const tgt = isSwapped ? session.alignment.src : session.alignment.tgt;
  const targetToSource = isSwapped
    ? session.alignment.align.srcToTgt
    : session.alignment.align.tgtToSrc;

  const sentId = tgt.sentIds[tgtIdx];
  const parId = tgt.parIds[tgtIdx];

  const srcAlignedGlobal = new Set(targetToSource[tgtIdx] ?? []);
  const tgtClickedGlobal = new Set([tgtIdx]);

  return {
    sentence: {
      src: buildContextTokenSlice({
        block: src,
        sliceGlobalWordIds: src.sentToWordIds[sentId],
        highlightedGlobalWordIds: srcAlignedGlobal,
      }),
      tgt: buildContextTokenSlice({
        block: tgt,
        sliceGlobalWordIds: tgt.sentToWordIds[sentId],
        highlightedGlobalWordIds: tgtClickedGlobal,
      }),
    },
    paragraph: {
      src: buildContextTokenSlice({
        block: src,
        sliceGlobalWordIds: src.parToWordIds[parId],
        highlightedGlobalWordIds: srcAlignedGlobal,
      }),
      tgt: buildContextTokenSlice({
        block: tgt,
        sliceGlobalWordIds: tgt.parToWordIds[parId],
        highlightedGlobalWordIds: tgtClickedGlobal,
      }),
    },
  };
}


/**************************
 * `buildGlossaryItemSaveRequest()`
 * -- Helper to construct glossary item save request data
 **************************/
export function buildGlossaryItemSaveRequest(args: {
  session: ReaderSession | null;
  defineData: DefineEntry | null;
  explainData: ExplainEntry | null;
  documentId: number | null;
  pageId: number | null;
  lockedTargetIndex: number | null;
  logicalSrcLang: string;
  logicalTgtLang: string;
  isSwapped: boolean;
}): GlossaryItemSaveRequest | null {
  const {
    session,
    defineData,
    explainData,
    documentId,
    pageId,
    lockedTargetIndex,
    logicalSrcLang,
    logicalTgtLang,
    isSwapped,
  } = args;

  if (!session) return null;
  if (!defineData || !explainData) return null;
  if (documentId == null || pageId == null) return null;
  if (lockedTargetIndex == null) return null;

  const logicalTargetBlock = isSwapped
    ? session.alignment.src
    : session.alignment.tgt;
  const sentId = logicalTargetBlock.sentIds[lockedTargetIndex];
  const parId = logicalTargetBlock.parIds[lockedTargetIndex];
  if (sentId == null || parId == null) return null;

  const contextAlignment = buildGlossaryContextAlignment({
    session,
    tgtIdx: lockedTargetIndex,
    isSwapped,
  });

  return {
    srcLang: logicalSrcLang,
    tgtLang: logicalTgtLang,
    definition: {
      form: defineData.form,
      posForm: defineData.posForm || null,
      ipaForm: defineData.ipaForm || null,
      lemma: defineData.lemma || null,
      posLemma: defineData.posLemma || null,
      ipaLemma: defineData.ipaLemma || null,
      gloss: defineData.gloss,
      srcSentence: defineData.srcSentence,
      srcParagraph: defineData.srcParagraph,
      tgtSentence: defineData.tgtSentence,
      tgtParagraph: defineData.tgtParagraph,
      contextAlignment,
      documentId,
      pageId,
      parId,
      sentId,
      wordId: lockedTargetIndex,
    },
    usage: {
      explanation: explainData.explanation,
      examples: explainData.examples,
    },
  };
}


/**************************
 * `buildPracticeItemFromAnnotateResponse()`
 * -- Convert a page annotation response into a shared `PracticeItem`
 **************************/
export function buildPracticeItemFromAnnotateResponse(args: {
  annotateResponse: AnnotateResponse;
  session: ReaderSession;
  documentId: number;
  pageId: number;
  documentTitle: string;
  logicalSrcLang: string;
  logicalTgtLang: string;
  tgtIdx: number;
  isSwapped: boolean;
}): PracticeItem {
  const {
    annotateResponse,
    session,
    documentId,
    pageId,
    documentTitle,
    logicalSrcLang,
    logicalTgtLang,
    tgtIdx,
    isSwapped,
  } = args;

  const logicalTargetBlock = isSwapped
    ? session.alignment.src
    : session.alignment.tgt;
  const sentId = logicalTargetBlock.sentIds[tgtIdx];
  const parId = logicalTargetBlock.parIds[tgtIdx];

  return {
    practiceItemId: makeAnnotationKey({
      documentId,
      pageId,
      tgtLang: logicalTgtLang,
      wordId: tgtIdx,
    }),
    source: "page",
    savedGlossaryItemId: null,
    documentTitle,
    srcLang: logicalSrcLang,
    tgtLang: logicalTgtLang,
    definition: {
      form: annotateResponse.definition.form,
      posForm: annotateResponse.definition.posForm || null,
      ipaForm: annotateResponse.definition.ipaForm || null,
      lemma: annotateResponse.definition.lemma || null,
      posLemma: annotateResponse.definition.posLemma || null,
      ipaLemma: annotateResponse.definition.ipaLemma || null,
      gloss: annotateResponse.definition.gloss,
      srcSentence: annotateResponse.definition.srcSentence,
      srcParagraph: annotateResponse.definition.srcParagraph,
      tgtSentence: annotateResponse.definition.tgtSentence,
      tgtParagraph: annotateResponse.definition.tgtParagraph,
      contextAlignment: buildGlossaryContextAlignment({
        session,
        tgtIdx,
        isSwapped,
      }),
      documentId,
      pageId,
      sentId,
      parId,
      wordId: tgtIdx,
    },
    usage: {
      explanation: annotateResponse.usage.explanation,
      examples: annotateResponse.usage.examples,
    },
  };
}
