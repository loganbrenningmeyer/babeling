import type {
  GlossaryItemDefinition,
  GlossaryItemUsage,
} from "@/app/(protected)/documents/feature/types/glossaryItem";

export type PracticeItemSource = "saved" | "page";

export type PracticeItem = {
  practiceItemId: string;
  source: PracticeItemSource;

  savedGlossaryItemId: number | null;

  documentTitle: string;
  srcLang: string;
  tgtLang: string;

  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
};