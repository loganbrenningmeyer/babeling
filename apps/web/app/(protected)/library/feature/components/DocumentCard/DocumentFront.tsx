"use client";

import Image from "next/image";
import { Book, Clock, RotateCcw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ResumeTranslationButton } from "./ResumeTranslationButton";
import { LangBadge } from "@/app/components/LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";
import { LANG_COLOR_BY_CODE } from "@/types/langs";

import { capitalizeWords, formatRelativeTime, truncate } from "@/lib/string";

import { LangLabels, toUiLang } from "@/app/i18n/messages";


export function DocumentFront({
  document,
  recentTranslation,
  translationsLoading,
  langs,
}: {
  document: LibraryDocument,
  recentTranslation: LibraryTranslation | null,
  translationsLoading: boolean,
  langs: LangLabels,
}) {
  // Source language color
  const srcAccent = LANG_COLOR_BY_CODE[document.srcLang as keyof typeof LANG_COLOR_BY_CODE].accent;

  // -------------------------
  // Get cover image from database
  // -- /api/documents/[documentId]/images/[coverImageId]
  // -------------------------
  const coverImageSrc = document.coverImageId
    ? `/api/documents/${document.id}/images/${document.coverImageId}`
    : null;

  const sampleLangCode = recentTranslation ? recentTranslation.tgtLang : document.srcLang;
  const sampleLangLabel = langs[toUiLang(sampleLangCode)];
  const sampleLangColors =
    LANG_COLOR_BY_CODE[sampleLangCode as keyof typeof LANG_COLOR_BY_CODE] ??
    LANG_COLOR_BY_CODE.en;

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
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {/* -------------------------
            * Cover Image
            * ------------------------- */}
            {coverImageSrc ? (
              <Image
                src={coverImageSrc}
                alt={
                  document.title
                    ? `${document.title} cover`
                    : "Document cover"
                }
                width={48}
                height={64}
                unoptimized
                className="h-16 w-12 shrink-0 rounded-md border border-border/60 object-cover shadow-sm"
              />
            ) : null}
            {/* -------------------------
            * Title / Author
            * ------------------------- */}
            <div>
              <h2 className="line-clamp-2 text-md font-reading font-medium leading-tight">
                {capitalizeWords(document.title)}
              </h2>
              <h3 className="text-sm font-ui text-muted-foreground">
                {document.author}
              </h3>
            </div>
          </div>
          <LangBadge lang={document.srcLang}/>
        </div>
        {/* -------------------------
        * Continue Button + Tap to view translations
        * ------------------------- */}
        <div className="mt-auto space-y-3">
          {/* -------------------------
          * Text Sample
          * ------------------------- */}
          <div className="rounded-lg border border-border/50 bg-muted/35 px-3 py-2">
            <div className="flex items-stretch gap-3">
              <p className="
                  min-w-0 flex-1
                  font-reading text-sm italic
                  text-muted-foreground leading-relaxed line-clamp-2
                "
              >
                {truncate(recentTranslation ? recentTranslation.tgtText : document.srcText, 100)}…
              </p>
              <div className="flex shrink-0 flex-col items-center justify-center gap-1 border-l border-border/50 pl-3">
                <LangBadge 
                  lang={sampleLangCode}
                />
                {recentTranslation && (
                  <span
                    className="
                      inline-flex items-center rounded-full
                      border border-border/60 bg-background/80
                      px-2 py-0.5 font-ui text-[11px]
                      text-muted-foreground
                    "
                  >
                    p. {recentTranslation.currentPageNumber}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Separator />
          <div 
            className="
              flex items-center justify-between 
              gap-4 whitespace-nowrap
            "
          >
            <div className="flex flex-col gap-2">
              <ResumeTranslationButton
                document={document}
                translation={recentTranslation}
                loading={translationsLoading}
              >
                <span>
                  Continue in{" "}
                  <span className={`rounded-xl border px-1 ${sampleLangColors.bg} ${sampleLangColors.border} ${sampleLangColors.text}`}>
                    {sampleLangLabel}
                  </span>
                </span>
              </ResumeTranslationButton>
            
              {recentTranslation && (
                <div 
                  className="
                    w-full flex justify-center gap-4
                    text-xs text-muted-foreground/60
                  "
                >
                  <span className="flex items-center gap-1">
                    <Book size={12}/> 
                    p. {recentTranslation.currentPageNumber} / {document.totalPages}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> 
                    {formatRelativeTime(recentTranslation.lastOpenedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <span 
        className="
          absolute bottom-2 right-4
          inline-flex gap-1 items-center 
          text-xs text-muted-foreground
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
    </Card>
  )
}
