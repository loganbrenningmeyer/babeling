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