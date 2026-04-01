import type { AlignmentPayload } from "../types/pageTranslation";
import type { ReaderSession } from "../types/readerSession";

/**************************
 * `makeInitialUiState()`
 * -- Initial UI begins with all source blurred and navigation at beginning
 **************************/
export function makeInitialUiState(srcWordCount: number) {
  return {
    blurredSource: new Set(Array.from({ length: srcWordCount }, (_, i) => i)),
    navSentId: -1,
    navParId: -1,
  };
}

/**************************
 * `makeReaderSession()`
 * -- Build ReaderSession data from src/tgtText + AlignmentPayload data
 **************************/
export function makeReaderSession(args: {
  srcText: string;
  tgtText: string;
  alignment: AlignmentPayload;
}): ReaderSession {
  const srcWordsCount = args.alignment.src.words.length;

  return {
    srcText: args.srcText,
    tgtText: args.tgtText,
    alignment: args.alignment,
    ui: makeInitialUiState(srcWordsCount),
  };
}

/**************************
 * `makeEmptyAlignment()`
 * -- Creates empty AlignmentPayload data when text is missing
 **************************/
function makeEmptyAlignment(): AlignmentPayload {
  return {
    src: {
      words: [],
      spaces: [],
      sentIds: [],
      parIds: [],
      sentToParIds: {},
      sentToWordIds: {},
      parToSentIds: {},
      parToWordIds: {},
    },
    tgt: {
      words: [],
      spaces: [],
      sentIds: [],
      parIds: [],
      sentToParIds: {},
      sentToWordIds: {},
      parToSentIds: {},
      parToWordIds: {},
    },
    align: {
      srcToTgt: {},
      tgtToSrc: {},
    },
  };
}

/**************************
 * `makeEmptyReaderSession()`
 * -- Build a no-text ReaderSession for image-only / empty pages
 **************************/
export function makeEmptyReaderSession(): ReaderSession {
  return {
    srcText: "",
    tgtText: "",
    alignment: makeEmptyAlignment(),
    ui: makeInitialUiState(0),
  };
}