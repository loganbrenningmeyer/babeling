import type { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import type { PracticeItem } from "../types/practiceItem";

export function makePracticeItemKey(args: {
  documentId: number;
  pageId: number;
  tgtLang: string;
  wordId: number;
}) {
  const { documentId, pageId, tgtLang, wordId } = args;
  return `${documentId}|${pageId}|${tgtLang}|${wordId}`;
}

export function fromLibraryGlossaryItem(
  glossaryItem: LibraryGlossaryItem
): PracticeItem {
  return {
    practiceItemId: makePracticeItemKey({
      documentId: glossaryItem.definition.documentId,
      pageId: glossaryItem.definition.pageId,
      tgtLang: glossaryItem.tgtLang,
      wordId: glossaryItem.definition.wordId,
    }),
    source: "saved",
    savedGlossaryItemId: glossaryItem.glossaryItemId,
    documentTitle: glossaryItem.documentTitle,
    srcLang: glossaryItem.srcLang,
    tgtLang: glossaryItem.tgtLang,
    definition: glossaryItem.definition,
    usage: glossaryItem.usage,
  };
}