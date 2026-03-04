"use client";

import { Minimize2 } from "lucide-react";

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



export function GlossaryItemBack({
  glossaryItem,
  langLabels,
  onClose,
}: {
  glossaryItem: LibraryGlossaryItem;
  langLabels: LangLabels,
  onClose: () => void;
}) {
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
        <CardContent className="h-full p-0 space-y-4 flex flex-col">
          {/* -------------------------
          //* ( Top: Non-scrollable ): Form + POS + IPA + Definition
          //* ------------------------- */}
          <div className="flex items-start justify-between">
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
                      text-md text-orange-600 font-ui 
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="
              group
                inline-flex items-center justify-center
                rounded-full p-1
                border border-muted-foreground
                opacity-0
                cursor-pointer
                transition duration-300 ease-out
                group-hover/gloss-back:opacity-60
                group-hover/gloss-back:bg-muted-foreground/10
                hover:opacity-100
              "
              aria-label="Close"
            >
              <Minimize2 
                className="
                  h-4 w-4
                  transform-gpu
                  transition-transform duration-150 ease-out
                  group-hover:scale-85
                  active:scale-80
                " 
              />
            </button>
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
                  <div className="border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-ui uppercase tracking-wide text-muted-foreground">
                          Original
                        </span>
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
                  <div className="border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-ui uppercase tracking-wide text-muted-foreground">
                          Translation
                        </span>
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
