"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LangBadge } from "@/app/components/LangBadge";
import { Maximize2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import type { LibraryGlossaryItem } from "../../types/glossaryItem";
import { LANG_COLOR_BY_CODE } from "@/types/langs";


export function GlossaryItemFront({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  // Language color
  const langAccent = LANG_COLOR_BY_CODE[glossaryItem.tgtLang as keyof typeof LANG_COLOR_BY_CODE].accent;

  return (
    <div 
      className="
        absolute inset-0 
        [backface-visibility:hidden] 
        [transform:translateZ(0)]
      "
    >
      <Card 
        className="
          relative rounded-xl h-full w-full overflow-hidden
          
          border bg-card p-5 pb-2 shadow-sm
          
          transform-gpu will-change-transform
          transition duration-200 ease-out
          
          group-hover/gloss-front:-translate-y-1
          group-hover/gloss-front:border-orange-400/60
          group-hover/gloss-front:shadow-md
          group-focus-visible/gloss-front:-translate-y-1
          group-focus-visible/gloss-front:border-orange-200
          group-focus-visible/gloss-front:shadow-md
        "
      >
        {/* Source Language Accent Strip */}
        <div className={`absolute inset-y-0 left-0 w-1.5 ${langAccent}`} />
        <CardContent className="h-full p-0 space-y-2 flex flex-col">
          {/* -------------------------
          //* Form + POS + Language Badge
          //* ------------------------- */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              {/* Form */}
              <div className="text-lg font-reading font-semibold leading-tight">
                {glossaryItem.definition.form.toLowerCase()}
              </div>
              {/* POS */}
              {glossaryItem.definition.posForm && (
                <div
                  className="
                    h-6 inline-flex 
                    text-md text-orange-600 font-ui 
                ">
                  {glossaryItem.definition.posForm}
                </div>
              )}
            </div>
            <LangBadge lang={glossaryItem.tgtLang} />
          </div>
          {/* -------------------------
          //* Definition
          //* ------------------------- */}
          <p className="line-clamp-2 text-sm font-ui">
            {glossaryItem.definition.gloss}
          </p>
          {/* -------------------------
          //* ( Bottom ): Originating Document
          //* ------------------------- */}
          <div className="mt-auto space-y-2">
            <Separator />
            <div className="flex items-center justify-between">
              {/* from {document title} */}
              <p className="font-ui text-xs text-muted-foreground">
                {"from "} 
                <span className="italic">
                  {glossaryItem.documentTitle}
                </span>
              </p>
              {/* Expand affordance on hover */}
              <Maximize2 
                className="
                  pointer-events-none
                  h-4 w-4
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