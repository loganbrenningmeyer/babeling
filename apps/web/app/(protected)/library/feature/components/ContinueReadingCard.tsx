"use client";

import { useState } from "react";
import Image from "next/image";
import { Book, MoveRight } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { LangBadge } from "@/app/components/LangBadge";

import { useRecentTranslations } from "../hooks/useRecentTranslations";
import { ResumeTranslationButton } from "../../../../components/ResumeTranslationButton";

import { LibraryDocument } from "../types/document";

import { getLangColors } from "@/lib/langs";
import { useMessages } from "@/app/hooks/useMessages";


export function ContinueReadingCard({
  document,
}: {
  document: LibraryDocument;
}) {
  const m = useMessages();
  const [failedCoverSrc, setFailedCoverSrc] = useState<string | null>(null);

  const coverImageSrc = document.coverImageId != null
    ? `/api/documents/${document.id}/images/${document.coverImageId}`
    : null;
  const showCoverImage = coverImageSrc && failedCoverSrc !== coverImageSrc;

  // -------------------------
  // Get document's most recent translation
  // -------------------------
  const { translations, loading } = useRecentTranslations({
    documentId: document.id,
    limit: 1,
  });

  const recentTranslation = translations[0] ?? null;
  const tgtLang = recentTranslation?.tgtLang ?? document.latestTgtLang;
  const currentPageNumber = recentTranslation?.currentPageNumber ?? 1;
  const completionPercent = recentTranslation?.completionPercent ?? 0;

  return (
    <div
      className="
        mt-6 flex w-full flex-col gap-4
        rounded-xl border border-border bg-card p-4
        sm:flex-row sm:items-center
      "
    >
      <div className="flex min-w-0 items-center gap-4">
        {/* Cover Image / Fallback Icon */}
        {showCoverImage ? (
          <Image
            src={coverImageSrc}
            alt={document.title ? `${document.title} cover` : m.library.documentCover}
            width={48}
            height={64}
            unoptimized
            onError={() => setFailedCoverSrc(coverImageSrc)}
            className="h-16 w-12 shrink-0 rounded-md border border-border/60 object-cover shadow-sm"
          />
        ) : (
          <div
            className="
              flex size-16 shrink-0 items-center justify-center
              rounded-lg border border-border bg-muted/60
            "
          >
            <Book className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Continue Reading / Title + Author */}
        <div className="flex h-16 min-w-0 flex-1 flex-col justify-center gap-0">
          <p className="font-ui text-xs font-bold uppercase text-muted-foreground">
            {m.library.continueReading}
          </p>
          <p className="truncate font-reading text-lg font-semibold text-foreground">
            {document.title}
          </p>
          <div className="inline-flex min-w-0 items-center gap-2 font-ui text-sm text-muted-foreground">
            {document.author ? (
              <>
                <span className="min-w-0 truncate">{document.author}</span>
                <span className="shrink-0" aria-hidden="true">•</span>
              </>
            ) : null}
            <LangBadge lang={document.srcLang} className="shrink-0 px-1.5 py-0 text-[10px]" />
            {tgtLang ? (
              <>
                <MoveRight size={10} className="shrink-0" />
                <LangBadge lang={tgtLang} className="shrink-0 px-1.5 py-0 text-[10px]" />
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="grid min-w-0 gap-3 sm:ml-auto sm:flex sm:shrink-0 sm:items-center sm:gap-4">
        <div className="min-w-0 sm:w-40">
          <div className="flex items-baseline gap-2">
            <div>
              <span className="font-reading text-lg font-semibold text-foreground">{m.library.pageAbbrev} {currentPageNumber}</span>
              <span className="font-reading text-sm font-normal text-foreground"> {m.library.of} {document.totalPages}</span>
            </div>
          </div>
          <Progress
            value={completionPercent}
            className="h-1 w-full bg-muted"
            indicatorClassName={tgtLang ? getLangColors(tgtLang).progress : undefined}
          />
        </div>

        <ResumeTranslationButton
          document={document}
          translation={recentTranslation}
          loading={loading}
          className="
            w-full rounded-full
            bg-blue-600 text-primary-foreground
            shadow-sm shadow-primary/20
            hover:bg-blue-600/90
            dark:bg-blue-600/80 dark:hover:bg-blue-600/70
            sm:w-auto
          "
        >
          {m.library.continue}
        </ResumeTranslationButton>
      </div>
    </div>
  )
}
