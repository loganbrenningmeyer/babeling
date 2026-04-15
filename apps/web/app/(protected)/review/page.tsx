"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { useRecentGlossaryItems } from "../library/feature/hooks/useRecentGlossaryItems";
import { PracticeDeck } from "../practice/feature/components/PracticeDeck";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";
import { fromLibraryGlossaryItem } from "../practice/feature/lib/toPracticeItem";


export default function Review() {
  const m = useMessages();

  // -------------------------
  // Get Glossary Items
  // -------------------------
  const { glossaryItems } = useRecentGlossaryItems();
  const [selectedTargetLanguages, setSelectedTargetLanguages] = useState<string[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);

  // -------------------------
  // Build available language filters
  // -------------------------
  const targetLanguageOptions = useMemo(
    () =>
      Array.from(new Set(glossaryItems.map((item) => item.tgtLang)))
        .sort((a, b) =>
          m.langs[toUiLang(a)].localeCompare(m.langs[toUiLang(b)])
        ),
    [glossaryItems, m.langs]
  );

  // -------------------------
  // Filter review items by target language
  // -------------------------
  const filteredGlossaryItems = useMemo(
    () =>
      selectedTargetLanguages.length === 0
        ? glossaryItems
        : glossaryItems.filter((item) =>
            selectedTargetLanguages.includes(item.tgtLang)
          ),
    [glossaryItems, selectedTargetLanguages]
  );

  const practiceItems = useMemo(
    () => filteredGlossaryItems.map(fromLibraryGlossaryItem),
    [filteredGlossaryItems]
  );

  useEffect(() => {
    setRemainingCount(practiceItems.length);
  }, [practiceItems]);

  /**************************
   * `toggleTargetLanguage()`
   * --
   * Toggle target-language filters.
   * When nothing is selected, the
   * review deck includes all languages.
   **************************/
  function toggleTargetLanguage(lang: string) {
    setSelectedTargetLanguages((current) =>
      current.includes(lang)
        ? current.filter((value) => value !== lang)
        : [...current, lang]
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[125px] overflow-hidden bg-background sm:top-[65px]">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-4 py-5 sm:px-8 sm:py-10">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <h1 className="font-reading text-3xl font-semibold tracking-tight sm:text-4xl">
          Review
        </h1>

        <p className="mt-2 font-ui text-sm text-muted-foreground sm:mt-3 sm:text-lg">
          {remainingCount} remaining
        </p>

        {/* -------------------------
        //* Target Language Filters
        //* ------------------------- */}
        <div className="mt-4 flex flex-col gap-2 sm:mt-6">
          <div
            className="
              font-ui uppercase tracking-widest
              text-xs text-foreground/80
            "
          >
            Target Language
          </div>
          <div className="flex flex-wrap gap-2">
            {targetLanguageOptions.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleTargetLanguage(lang)}
                className={cn(
                  "inline-flex h-8 items-center justify-center rounded-full border px-2.5 sm:h-10 sm:px-3",
                  "font-ui text-xs font-medium tracking-wide",
                  "cursor-pointer select-none transition-colors duration-200 ease-out",
                  "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  selectedTargetLanguages.includes(lang) &&
                    "border-primary/30 bg-primary/5 text-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {m.langs[toUiLang(lang)]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1 sm:mt-10">
          <PracticeDeck
            practiceItems={practiceItems}
            onRemainingChange={setRemainingCount}
            emptyState={<div />}
          />
        </div>
      </div>
    </div>
  );
}
