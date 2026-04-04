"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { useRecentGlossaryItems } from "../library/feature/hooks/useRecentGlossaryItems";
import { PracticeDeck } from "../practice/feature/components/PracticeDeck";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";


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

  useEffect(() => {
    setRemainingCount(filteredGlossaryItems.length);
  }, [filteredGlossaryItems]);

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
    <div className="fixed inset-x-0 bottom-0 top-[65px] overflow-hidden bg-background">
      <div className="mx-auto flex h-full max-w-6xl flex-col px-8 py-10">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <h1 className="font-reading font-semibold text-4xl tracking-tight">
          Review
        </h1>

        <p className="mt-3 font-ui text-lg text-muted-foreground">
          {remainingCount} remaining
        </p>

        {/* -------------------------
        //* Target Language Filters
        //* ------------------------- */}
        <div className="mt-6 flex flex-col gap-2">
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
                  "inline-flex h-10 items-center justify-center rounded-full border px-3",
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

        <div className="mt-10 flex-1 min-h-0">
          <PracticeDeck
            glossaryItems={filteredGlossaryItems}
            onRemainingChange={setRemainingCount}
            emptyState={<div />}
          />
        </div>
      </div>
    </div>
  );
}
