"use client";

import { X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { HighlightedTokenSlice } from "./HighlightedTokenSlice";
import { LangBadge } from "@/app/components/LangBadge";
import { PronounceButton } from "@/app/(protected)/documents/feature/components/Pronounce/PronounceButton";
import { UsageInfo } from "./UsageInfo";

import type { LibraryGlossaryItem } from "../../types/glossaryItem";
import { LangLabels, toUiLang } from "@/app/i18n/messages";
import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { useMessages } from "@/app/hooks/useMessages";



export function GlossaryItemBack({
  glossaryItem,
  langLabels,
  onClose,
}: {
  glossaryItem: LibraryGlossaryItem;
  langLabels: LangLabels,
  onClose: () => void;
}) {
  const m = useMessages();
  const srcHighlightClass = LANG_COLOR_BY_CODE[toUiLang(glossaryItem.srcLang)].highlight;
  const tgtHighlightClass = LANG_COLOR_BY_CODE[toUiLang(glossaryItem.tgtLang)].highlight;

  return (
    <div 
      className="
        absolute inset-0 
        cursor-default
        [backface-visibility:hidden] 
        [transform:translateZ(0)]
      "
    >
      <Card 
        className="
          relative 
          h-full w-full 
          p-5
          rounded-xl border bg-card shadow-sm
        "
      >
        <CardContent className="relative flex h-full flex-col space-y-4 p-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="
              absolute right-0 top-0 z-10
              inline-flex h-7 w-7 items-center justify-center
              rounded-full border border-border/70 bg-background/80
              text-muted-foreground
              transition-colors duration-150
              hover:bg-background hover:text-foreground
            "
            aria-label={m.library.close}
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* -------------------------
          //* ( Top: Non-scrollable ): Form + POS + IPA + Definition
          //* ------------------------- */}
          <div className="flex items-start justify-between pr-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2">
                {/* Form */}
                <div className="text-xl font-reading font-semibold leading-tight">
                  {glossaryItem.definition.form.toLowerCase()}
                </div>
                <LangBadge lang={glossaryItem.tgtLang} />
              </div>
              {/* POS + IPA */}
              <div className="flex flex-wrap items-center gap-2">
                {glossaryItem.definition.posForm && (
                  <div
                    className="
                      h-6 inline-flex 
                      text-md text-warning-subtle-foreground font-ui 
                    "
                  >
                    {glossaryItem.definition.posForm}
                  </div>
                )}
                {/* IPA */}
                {glossaryItem.definition.ipaForm && (
                  <PronounceButton
                    text={glossaryItem.definition.form}
                    label={glossaryItem.definition.ipaForm}
                    tgtLang={glossaryItem.tgtLang}
                    className="h-6 text-sm font-ui"
                    iconClassName="h-3 w-3"
                  />
                )}
              </div>
            </div>
          </div>
          {/* Definition */}
          <p className="text-md leading-6 font-ui">
            {glossaryItem.definition.gloss}
          </p>

          {/* -------------------------
          //* ( Bottom: Scrollable ): Context Alignment + Explanation + Examples
          //* ------------------------- */}
          <Separator />

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-3">
              <div className="space-y-3">
                <p className="font-ui text-sm text-muted-foreground italic">
                  {glossaryItem.documentTitle}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* -------------------------
                  //* Source Sentence
                  //* ------------------------- */}
                  <div className="border border-border bg-subtle p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LangBadge 
                          lang={glossaryItem.srcLang} 
                          labels={langLabels}
                          useLabel={true}
                        />
                      </div>
                    </div>
                    <HighlightedTokenSlice
                      slice={glossaryItem.definition.contextAlignment.sentence.src}
                      className="font-ui text-sm leading-6 text-foreground/80"
                      highlightClassName={srcHighlightClass}
                    />
                  </div>

                  {/* -------------------------
                  //* Target Sentence
                  //* ------------------------- */}
                  <div className="border border-border bg-subtle p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LangBadge 
                          lang={glossaryItem.tgtLang} 
                          labels={langLabels}
                          useLabel={true}
                        />
                      </div>
                    </div>
                    <HighlightedTokenSlice
                      slice={glossaryItem.definition.contextAlignment.sentence.tgt}
                      className="font-ui text-sm leading-6 text-foreground/80"
                      highlightClassName={tgtHighlightClass}
                    />
                  </div>
                </div>
                {/* -------------------------
                //* Explanation / Examples
                //* ------------------------- */}
                <Separator />

                <UsageInfo
                  explanation={glossaryItem.usage.explanation}
                  examples={glossaryItem.usage.examples}
                />
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
