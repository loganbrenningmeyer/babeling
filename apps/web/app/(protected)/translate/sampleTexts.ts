export type SampleText = {
  id: string;
  label: string;
  filename: string;
};

export const SAMPLE_TEXTS_BY_LANG: Record<string, SampleText[]> = {
  en: [
    { id: "the-little-prince", label: "The Little Prince", filename: "the-little-prince.txt" },
    { id: "the-alchemist", label: "The Alchemist", filename: "the-alchemist.txt"},
    { id: "frankenstein", label: "Frankenstein", filename: "frankenstein.txt"},
  ],
  fr: [
    { id: "le-petit-prince", label: "Le Petit Prince", filename: "le-petit-prince.txt"},
    { id: "les-miserables", label: "Les Miserables", filename: "les-miserables.txt"},
  ],
};
