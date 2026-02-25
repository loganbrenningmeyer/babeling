"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Play } from "lucide-react";
import { ResumeTranslationButton } from "./ResumeTranslationButton";
import { LangBadge } from "./LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";
import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { truncate, capitalizeWords, formatRelativeTime } from "@/lib/string";


export function DocumentFront({
  document,
  recentTranslation,
  translationsLoading,
}: {
  document: LibraryDocument,
  recentTranslation: LibraryTranslation | null,
  translationsLoading: boolean,
}) {
  // -------------------------
  // Language Colors
  // -------------------------
  const srcAccent = LANG_COLOR_BY_CODE[document.srcLang as keyof typeof LANG_COLOR_BY_CODE].accent;

  {/* -------------------------
  * ( Front ): Document Info
  * ------------------------- */}
  return (
    <div className="absolute inset-0 rounded-3xl [backface-visibility:hidden]">
      <Card className="relative h-full w-full overflow-hidden rounded-3xl border bg-card p-5 shadow-sm">
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
              "{truncate(document.srcText, 100)}…"
            </p>
          </div>
          {/* -------------------------
          * Continue Button + Tap to view translations
          * ------------------------- */}
          <Separator />
          <div className="mt-auto flex items-center justify-between gap-4 whitespace-nowrap">
            <ResumeTranslationButton
              document={document}
              translation={recentTranslation}
              loading={translationsLoading}
            />
            <span className="inline-flex gap-1 items-center text-xs text-muted-foreground">
              Translations
              <ChevronRight size={14}/>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
