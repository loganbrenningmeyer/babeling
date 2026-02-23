import type { AlignmentPayload } from "./pageTranslation";

export type ReaderSession = {
  srcText: string;
  tgtText: string;

  alignment: AlignmentPayload;

  ui: {
    blurredSource: Set<number>;
    navSentId: number;
    navParId: number;
  };
};