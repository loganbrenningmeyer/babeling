export type Session = {
  sourceText: string;
  targetText: string;

  src: {
    words: string[];
    spaces: string[];
    sentIds: number[];
    sentToParIds: Record<number, number>;
    sentToWordIds: Record<number, number[]>;
    parIds: number[];
    parToSentIds: Record<number, number[]>;
    parToWordIds: Record<number, number[]>;
  };

  tgt: {
    words: string[];
    spaces: string[];
    sentIds: number[];
    sentToParIds: Record<number, number>;
    sentToWordIds: Record<number, number[]>;
    parIds: number[];
    parToSentIds: Record<number, number[]>;
    parToWordIds: Record<number, number[]>;
  };

  align: {
    srcToTgt: Record<number, number[]>;
    tgtToSrc: Record<number, number[]>;
  };

  state: {
    blurredSource: Set<number>;
    navSentId: number;
    navParId: number;
  };
};