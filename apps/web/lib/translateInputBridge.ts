export type TranslateInputPayload = {
  sourceText: string;
  title: string;
  srcLang: string;
  tgtLang: string;
  pages?: string[];
  pageDbIds?: number[];
};

let pendingTranslateInput: TranslateInputPayload | null = null;

export function setPendingTranslateInput(input: TranslateInputPayload) {
  pendingTranslateInput = { ...input };
}

export function takePendingTranslateInput() {
  const next = pendingTranslateInput;
  pendingTranslateInput = null;
  return next;
}
