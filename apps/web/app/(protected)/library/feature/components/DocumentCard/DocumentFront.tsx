"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";
import { ResumeTranslationButton } from "./ResumeTranslationButton";
import { LangBadge } from "@/app/components/LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";
import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { truncate, capitalizeWords } from "@/lib/string";


export function DocumentFront({
  document,
  recentTranslation,
  translationsLoading,
}: {
  document: LibraryDocument,
  recentTranslation: LibraryTranslation | null,
  translationsLoading: boolean,
}) {
  // Source language color
  const srcAccent = LANG_COLOR_BY_CODE[document.srcLang as keyof typeof LANG_COLOR_BY_CODE].accent;

  {/* -------------------------
  * ( Front ): Document Info
  * ------------------------- */}
  return (
    <Card className="
      relative rounded-xl h-full w-full overflow-hidden
      border bg-card p-5 shadow-sm
      transform-gpu will-change-transform
      transition duration-200 ease-out
      group-hover/doc-card:-translate-y-1
      group-hover/doc-card:border-blue-400/60
      group-hover/doc-card:shadow-md
      group-focus-visible/doc-card:-translate-y-1
      group-focus-visible/doc-card:border-orange-200
      group-focus-visible/doc-card:shadow-md
    ">
      {/* Source Language Accent Strip */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${srcAccent}`} />
      <CardContent className="h-full p-0 space-y-4 flex flex-col">
        {/* -------------------------
        * Title + Source Language Badge
        * ------------------------- */}
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-reading font-medium leading-tight">
            {capitalizeWords(document.title)}
          </h2>
          <LangBadge lang={document.srcLang}/>
        </div>
        {/* -------------------------
        * Author + Text Sample
        * ------------------------- */}
        <div className="flex">
          <p className="
            font-reading text-sm italic
            text-muted-foreground leading-relaxed line-clamp-3
          ">
            {truncate(document.srcText, 100)}…
          </p>
        </div>
        {/* -------------------------
        * Continue Button + Tap to view translations
        * ------------------------- */}
        <Separator />
        <div className="mt-auto flex items-center justify-between gap-4 whitespace-nowrap">
          {recentTranslation && (
            <ResumeTranslationButton
              document={document}
              translation={recentTranslation}
              loading={translationsLoading}
            >
              <span>Continue</span>
              <LangBadge lang={recentTranslation.tgtLang} />
            </ResumeTranslationButton>
          )}
          <span className="inline-flex gap-1 items-center text-xs text-muted-foreground">
            Translations
            <ChevronRight size={14}/>
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
