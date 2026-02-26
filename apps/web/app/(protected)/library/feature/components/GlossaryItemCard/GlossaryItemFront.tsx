"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LangBadge } from "@/app/components/LangBadge";
import { PronounceButton } from "@/app/(protected)/documents/feature/components/Pronounce/PronounceButton";

import { LibraryGlossaryItem } from "../../types/glossaryItem";

import { capitalizeWords } from "@/lib/string";
import { LANG_COLOR_BY_CODE } from "@/types/langs";


export function GlossaryItemFront({
  glossaryItem,
}: {
  glossaryItem: LibraryGlossaryItem,
}) {
  // Language color
  const langAccent = LANG_COLOR_BY_CODE[glossaryItem.tgtLang as keyof typeof LANG_COLOR_BY_CODE].accent;

  return (
    <div className="absolute inset-0 [backface-visibility:hidden] [transform:translateZ(0)]">
      <Card className="
        relative rounded-xl h-full w-full overflow-hidden
        border bg-card p-5 shadow-sm
        transform-gpu will-change-transform
        transition duration-200 ease-out
        group-hover:-translate-y-1
        group-hover:border-orange-400/60
        group-hover:shadow-md
        group-focus-visible:-translate-y-1
        group-focus-visible:border-orange-200
        group-focus-visible:shadow-md
      ">
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
              {/* POS + IPA */}
              <div className="flex flex-wrap items-center gap-2">
                {glossaryItem.definition.posForm && (
                  <div
                    className="
                      h-6 inline-flex 
                      text-md text-orange-600 font-ui 
                  ">
                    {glossaryItem.definition.posForm}
                  </div>
                )}

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
          {/* -------------------------
          //* Definition
          //* ------------------------- */}
          <p className="text-sm leading-6 font-ui">
            {glossaryItem.definition.gloss}
          </p>
          {/* -------------------------
          //* ( Bottom ): Originating Document
          //* ------------------------- */}
          <div className="mt-auto space-y-2">
            <Separator />
            
            <p className="font-ui text-xs text-muted-foreground">
              {"from "} 
              <span className="italic">
                {capitalizeWords(glossaryItem.documentTitle)}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}