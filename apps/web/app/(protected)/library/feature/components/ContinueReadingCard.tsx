"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Book, MoveRight } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { LangBadge } from "@/app/components/LangBadge";

import { useRecentTranslations } from "../hooks/useRecentTranslations";
import { ResumeTranslationButton } from "../../../../components/ResumeTranslationButton";

import { LibraryDocument } from "../types/document";

import { getLangColors } from "@/lib/langs";


export function ContinueReadingCard({
  document,
}: {
  document: LibraryDocument;
}) {
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);

  const coverImageSrc = document.coverImageId != null
    ? `/api/documents/${document.id}/images/${document.coverImageId}`
    : null;
  const showCoverImage = coverImageSrc && !coverLoadFailed;

  useEffect(() => {
    setCoverLoadFailed(false);
  }, [document.id, document.coverImageId]);

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
        flex w-full
        items-center
        gap-4 p-4 mt-6
        rounded-xl
        bg-card
        border border-border
      "
    >
      {/* Cover Image / Fallback Icon */}
      {showCoverImage ? (
        <Image
          src={coverImageSrc}
          alt={document.title ? `${document.title} cover` : "Document cover"}
          width={48}
          height={64}
          unoptimized
          onError={() => setCoverLoadFailed(true)}
          className="h-16 w-12 shrink-0 rounded-md border border-border/60 object-cover shadow-sm"
        />
      ) : (
        <div 
          className="
            flex items-center justify-center 
            size-16 shrink-0
            rounded-lg 
            border border-border bg-muted/60
          "
        >
          <Book className="h-8 w-8 text-muted-foreground"/>
        </div>
      )}

      {/* Continue Reading / Title + Author */}
      <div 
        className="
          flex min-w-0 flex-1 flex-col justify-center
          h-16 gap-0
        "
      >
        <p className="font-ui font-bold text-xs text-muted-foreground uppercase">
          Continue reading
        </p>
        <p className="truncate font-reading font-semibold text-lg text-foreground">
          {document.title}
        </p>
        <div className="inline-flex items-center gap-2 font-ui text-sm text-muted-foreground">
          {document.author ? (
            <>
              <span className="truncate">{document.author}</span>
              <span aria-hidden="true">•</span>
            </>
          ) : null}
          <LangBadge lang={document.srcLang} className="text-[10px] px-1.5 py-0"/>
          {tgtLang ? (
            <>
              <MoveRight size={10}/>
              <LangBadge lang={tgtLang} className="text-[10px] px-1.5 py-0"/>
            </>
          ) : null}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex ml-auto gap-4 shrink-0">
        <div className="flex-1 w-40">
          <div className="flex items-baseline gap-2">
            <div>
              <span className="text-lg text-foreground font-reading font-semibold">p. {currentPageNumber}</span>
              <span className="text-sm text-foreground font-reading font-normal"> of {document.totalPages}</span>
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
            rounded-full
            bg-primary/80 text-primary-foreground
            hover:bg-primary
            shadow-sm shadow-primary/20
          "
        >
          Continue
        </ResumeTranslationButton>
      </div>
    </div>
  )
}
