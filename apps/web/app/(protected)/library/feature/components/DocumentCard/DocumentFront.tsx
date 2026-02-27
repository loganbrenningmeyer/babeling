"use client";

import { RotateCcw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ResumeTranslationButton } from "./ResumeTranslationButton";
import { LangBadge } from "@/app/components/LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";
import { LANG_COLOR_BY_CODE } from "@/types/langs";

import { capitalizeWords, formatRelativeTime, truncate } from "@/lib/string";


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
    <Card 
      className="
        relative h-full w-full overflow-hidden

        rounded-xl border bg-card p-5 pb-2 shadow-sm
        
        transform-gpu will-change-transform
        transition duration-200 ease-out
        
        group-hover/doc-front:-translate-y-1
        group-hover/doc-front:border-blue-400/60
        group-hover/doc-front:shadow-md
        group-focus-visible/doc-front:-translate-y-1
        group-focus-visible/doc-front:border-orange-200
        group-focus-visible/doc-front:shadow-md
      "
    >
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
        <div 
          className="
            flex items-center justify-between 
            mt-auto gap-4 whitespace-nowrap
          "
        >
          <div className="flex flex-col items-center gap-1">
            <ResumeTranslationButton
              document={document}
              translation={recentTranslation}
              loading={translationsLoading}
            >
              <span>Continue</span>
              {recentTranslation && (
                <LangBadge lang={recentTranslation.tgtLang} />
              )}
            </ResumeTranslationButton>
            
            {recentTranslation && (
              <p className="text-xs text-muted-foreground/60 text-center italic">
                Read {formatRelativeTime(recentTranslation.lastOpenedAt)}
              </p>
            )}
          </div>
          <span 
            className="
              inline-flex gap-1 items-center 
              text-xs text-muted-foreground
              text-muted-foreground
              pointer-events-none
              opacity-0 group-hover/doc-front:opacity-60
              transition-opacity duration-150
            "
          >
            Translations
            <RotateCcw 
              className="
                h-4 w-4
                transition-transform duration-300 ease-out
                group-hover/doc-front:-rotate-180
              "
            />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
