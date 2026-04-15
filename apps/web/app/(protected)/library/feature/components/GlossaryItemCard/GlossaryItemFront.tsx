"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LangBadge } from "@/app/components/LangBadge";
import { Maximize2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import type { LibraryGlossaryItem } from "../../types/glossaryItem";
import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";


export function GlossaryItemFront({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  const m = useMessages();
  const langColors = LANG_COLOR_BY_CODE[toUiLang(glossaryItem.tgtLang)];
  const langAccent = langColors.accent;
  const glossaryHoverBorder = langColors.glossaryHoverBorder;

  return (
    <div 
      className="
        absolute inset-0 
        [backface-visibility:hidden] 
        [transform:translateZ(0)]
      "
    >
      <Card 
        className={`
          relative rounded-xl h-full w-full overflow-hidden
          
          border bg-card p-3 pb-2 shadow-sm sm:p-5 sm:pb-2
          
          transform-gpu will-change-transform
          transition duration-200 ease-out
          
          group-hover/gloss-front:-translate-y-1
          ${glossaryHoverBorder}
          group-hover/gloss-front:shadow-md
          group-focus-visible/gloss-front:-translate-y-1
          group-focus-visible/gloss-front:shadow-md
        `}
      >
        {/* Source Language Accent Strip */}
        <div className={`absolute inset-y-0 left-0 w-1.5 ${langAccent}`} />
        <CardContent className="flex h-full flex-col space-y-2 p-0">
          {/* -------------------------
          //* Form + POS + Language Badge
          //* ------------------------- */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              {/* Form */}
              <div className="truncate font-reading text-sm font-semibold leading-tight sm:text-lg">
                {glossaryItem.definition.form.toLowerCase()}
              </div>
              {/* POS */}
              {glossaryItem.definition.posForm && (
                <div
                  className="
                    h-6 inline-flex 
                    font-ui text-xs text-orange-600 sm:text-md
                ">
                  {glossaryItem.definition.posForm}
                </div>
              )}
            </div>
            <LangBadge lang={glossaryItem.tgtLang} className="shrink-0 text-[10px] sm:text-xs" />
          </div>
          {/* -------------------------
          //* Definition
          //* ------------------------- */}
          <p className="line-clamp-2 font-ui text-xs sm:text-sm">
            {glossaryItem.definition.gloss}
          </p>
          {/* -------------------------
          //* ( Bottom ): Originating Document
          //* ------------------------- */}
          <div className="mt-auto space-y-2">
            <Separator />
            <div className="flex items-center justify-between gap-2">
              {/* from {document title} */}
              <p className="line-clamp-2 min-w-0 font-ui text-[11px] text-muted-foreground sm:text-xs">
                {`${m.library.from} `}
                <span className="italic">
                  {glossaryItem.documentTitle}
                </span>
              </p>
              {/* Expand affordance on hover */}
              <Maximize2 
                className="
                  pointer-events-none
                  h-4 w-4 shrink-0
                  text-muted-foreground
                  opacity-0 group-hover/gloss-front:opacity-60
                  transition-opacity duration-150
                "
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
