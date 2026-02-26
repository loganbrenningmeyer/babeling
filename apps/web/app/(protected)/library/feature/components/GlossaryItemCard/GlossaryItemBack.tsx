"use client";

import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighlightedTokenSlice } from "./HighlightedTokenSlice";
import { LangBadge } from "@/app/components/LangBadge";
import { PronounceButton } from "@/app/(protected)/documents/feature/components/Pronounce/PronounceButton";
import { UsageInfo } from "./UsageInfo";

import { LibraryGlossaryItem } from "../../types/glossaryItem";

import { capitalizeWords } from "@/lib/string";

export function GlossaryItemBack({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem;
}) {
  return (
    <div className="absolute inset-0 [backface-visibility:hidden] [transform:translateZ(0)]">
      <Card className="relative rounded-xl h-full w-full border bg-card p-5 shadow-sm">
        <CardContent className="h-full p-0 space-y-4 flex flex-col">
          {/* -------------------------
          //* ( Top: Non-scrollable ): Form + POS + IPA + Definition
          //* ------------------------- */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {/* Form */}
              <div className="text-xl font-reading font-semibold leading-tight">
                {glossaryItem.definition.form.toLowerCase()}
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
            <LangBadge lang={glossaryItem.tgtLang} />
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
                  {capitalizeWords(glossaryItem.documentTitle)}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* -------------------------
                  //* Source Sentence
                  //* ------------------------- */}
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-ui uppercase tracking-wide text-muted-foreground">
                          Original
                        </span>
                        <LangBadge
                          lang={glossaryItem.srcLang}
                        />
                      </div>
                    </div>
                    <HighlightedTokenSlice
                      slice={glossaryItem.definition.contextAlignment.sentence.src}
                      className="text-sm leading-6 text-foreground/80"
                      highlightClassName="bg-blue-500/20"
                    />
                  </div>

                  {/* -------------------------
                  //* Target Sentence
                  //* ------------------------- */}
                  <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-ui uppercase tracking-wide text-muted-foreground">
                          Translation
                        </span>
                        <LangBadge lang={glossaryItem.tgtLang} />
                      </div>
                    </div>
                    <HighlightedTokenSlice
                      slice={glossaryItem.definition.contextAlignment.sentence.tgt}
                      className="text-sm leading-6 text-foreground/80"
                      highlightClassName="bg-orange-500/20"
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
