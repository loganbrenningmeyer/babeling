"use client";

import { Book, MoveRight } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { LangBadge } from "@/app/components/LangBadge";

import { useRecentTranslations } from "../hooks/useRecentTranslations";
import { ResumeTranslationButton } from "./DocumentCard/ResumeTranslationButton";

import { LibraryDocument } from "../types/document";

import { getLangColors } from "@/lib/langs";


export function ContinueReadingCard({
  document,
}: {
  document: LibraryDocument;
}) {
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
        bg-zinc-800
      "
    >
      {/* Book Icon */}
      <div 
        className="
          flex items-center justify-center 
          size-16 shrink-0
          rounded-lg 
          border border-zinc-500 bg-zinc-700/80
        "
      >
        <Book className="h-8 w-8 text-zinc-500"/>
      </div>

      {/* Continue Reading / Title + Author */}
      <div 
        className="
          flex min-w-0 flex-1 flex-col justify-center
          h-16 gap-0
        "
      >
        <p className="font-ui font-bold text-xs text-zinc-400 uppercase">
          Continue reading
        </p>
        <p className="truncate font-reading text-lg text-zinc-100">
          {document.title}
        </p>
        <div className="inline-flex items-center gap-2 font-ui text-sm text-zinc-400">
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
              <span className="text-lg text-zinc-100 font-reading font-semibold">p. {currentPageNumber}</span>
              <span className="text-sm text-zinc-100 font-reading font-normal"> of {document.totalPages}</span>
            </div>
          </div>
          <Progress 
            value={completionPercent}
            className="h-1 w-full bg-zinc-600"
            indicatorClassName={tgtLang ? getLangColors(tgtLang).progress : undefined}
          />
        </div>
        
        <ResumeTranslationButton
          document={document}
          translation={recentTranslation}
          loading={loading}
          className="
            rounded-md
            bg-background text-foreground/80 border-none
            hover:bg-background/95 text-foreground
          "
        >
          Continue
        </ResumeTranslationButton>
      </div>
    </div>
  )
}
