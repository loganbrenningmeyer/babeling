"use client";

import Image from "next/image";
import { BookText, Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ResumeTranslationButton } from "../../../../../components/ResumeTranslationButton";
import { LangBadge } from "@/app/components/LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";
import { LANG_COLOR_BY_CODE } from "@/types/langs";

import { formatRelativeTime, truncate } from "@/lib/string";

import { LangLabels, toUiLang } from "@/app/i18n/messages";
import { useMessages } from "@/app/hooks/useMessages";


export function DocumentFront({
  document,
  recentTranslation,
  translationsLoading,
  langLabels,
}: {
  document: LibraryDocument,
  recentTranslation: LibraryTranslation | null,
  translationsLoading: boolean,
  langLabels: LangLabels,
}) {
  const m = useMessages();
  const srcLangColors = LANG_COLOR_BY_CODE[toUiLang(document.srcLang)];
  const srcAccent = srcLangColors.accent;
  const srcHoverBorder = srcLangColors.hoverBorder;

  // -------------------------
  // Get cover image from database
  // -- /api/documents/[documentId]/images/[coverImageId]
  // -------------------------
  const coverImageSrc = document.coverImageId
    ? `/api/documents/${document.id}/images/${document.coverImageId}`
    : null;

  const sampleLangCode = recentTranslation ? recentTranslation.tgtLang : document.srcLang;
  const sampleLangLabel = langLabels[toUiLang(sampleLangCode)];
  const sampleLangColors = LANG_COLOR_BY_CODE[toUiLang(sampleLangCode)];
  const sampleText = truncate(recentTranslation ? recentTranslation.tgtText : document.srcText, 100);
  const sampleMetaLabel = recentTranslation
    ? `${m.library.pageAbbrev} ${recentTranslation.currentPageNumber}`
    : `${document.totalPages} ${m.library.pages}`;
  const sampleTime = recentTranslation
    ? formatRelativeTime(recentTranslation.lastOpenedAt)
    : document.lastOpenedAt
      ? formatRelativeTime(document.lastOpenedAt)
      : null;

  {/* -------------------------
  * ( Front ): Document Info
  * ------------------------- */}
  return (
    <Card 
      className={`
        relative h-full w-full overflow-hidden

        rounded-xl border bg-card p-3 shadow-sm sm:p-5
        
        transform-gpu will-change-transform
        transition duration-200 ease-out
        
        group-hover/doc-front:-translate-y-1
        ${srcHoverBorder}
        group-hover/doc-front:shadow-md
        group-focus-visible/doc-front:shadow-md
      `}
    >
      {/* Source Language Accent Strip */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${srcAccent}`} />
      <CardContent className="flex h-full flex-col gap-3 p-0 sm:gap-4">
        {/* -------------------------
        * Title + Source Language Badge
        * ------------------------- */}
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-start gap-2 sm:gap-3">
            {/* -------------------------
            * Cover Image
            * ------------------------- */}
            {coverImageSrc ? (
              <Image
                src={coverImageSrc}
                alt={
                  document.title
                    ? `${document.title} cover`
                    : m.library.documentCover
                }
                width={48}
                height={64}
                unoptimized
                className="h-14 w-10 shrink-0 rounded-md border border-border/60 object-cover shadow-sm sm:h-16 sm:w-12"
              />
            ) : (
              <div
                className="
                  flex h-14 w-10 shrink-0 items-center justify-center sm:h-16 sm:w-12
                  rounded-md border border-border/60 bg-muted/40 text-muted-foreground/70
                  shadow-sm
                "
                aria-hidden="true"
              >
                <BookText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            )}
            {/* -------------------------
            * Title / Author
            * ------------------------- */}
            <div className="min-w-0">
              <h2 className="line-clamp-2 font-reading text-sm font-semibold leading-tight sm:text-md">
                {document.title}
              </h2>
              <h3 className="line-clamp-1 font-ui text-[11px] text-muted-foreground sm:text-xs">
                {document.author}
              </h3>
            </div>
          </div>
          <LangBadge lang={document.srcLang} className="shrink-0 text-[10px] sm:text-xs"/>
        </div>

        <Separator />

        <div className="mt-auto flex flex-1 flex-col">
          {/* -------------------------
          * Continue Recent Translation Info
          * ------------------------- */}
          <div className="flex flex-1 flex-col gap-2 border border-border/50 bg-muted/35 p-2">
            <div className="flex items-center justify-between gap-2 text-[10px] font-medium tracking-wide text-muted-foreground/80 sm:gap-3 sm:text-[11px]">
              {/* -------------------------
              * Page Number / Last Opened Time
              * ------------------------- */}
              <span className="border border-border px-2">
                {sampleMetaLabel}
              </span>
              {sampleTime ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Clock size={12} className="shrink-0" />
                  <span className="truncate">{sampleTime}</span>
                </span>
              ) : null}
            </div>
            {/* -------------------------
            * Sample Text
            * ------------------------- */}
            <p
              className="
                min-w-0 flex-1
                font-reading text-[11px] italic sm:text-xs
                text-muted-foreground leading-relaxed 
                line-clamp-2 sm:line-clamp-2
              "
            >
              {sampleText}…
            </p>
            {/* -------------------------
            * Resume Translation Button
            * ------------------------- */}
            <Separator />

            <div className="flex w-full">
              <ResumeTranslationButton
                document={document}
                translation={recentTranslation}
                loading={translationsLoading}
                className="w-full rounded-none px-2 text-xs sm:px-6 sm:text-sm"
              >
                <span className="min-w-0 truncate">
                  {m.library.continueIn}{" "}
                  <span className={`rounded-xl border px-1 ${sampleLangColors.bg} ${sampleLangColors.border} ${sampleLangColors.text}`}>
                    {sampleLangLabel}
                  </span>
                </span>
              </ResumeTranslationButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
