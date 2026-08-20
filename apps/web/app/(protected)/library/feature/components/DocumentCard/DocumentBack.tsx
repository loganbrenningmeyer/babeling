"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Clock, RotateCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadialProgress } from "@/app/components/RadialProgress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ResumeTranslationButton } from "../../../../../components/ResumeTranslationButton";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";

import { formatRelativeTime } from "@/lib/string";
import { getLangColors } from "@/lib/langs";
import { LangLabels, toUiLang } from "@/app/i18n/messages";
import { LANG_COLOR_BY_CODE } from "@/types/langs";
import { useMessages } from "@/app/hooks/useMessages";


export function DocumentBack({
  document,
  translations,
  langLabels,
  loading,
  error,
}: {
  document: LibraryDocument,
  translations: LibraryTranslation[],
  langLabels: LangLabels,
  loading: boolean,
  error: string | null,
}) {
  const m = useMessages();
  // -------------------------
  // Sort translations by lastOpenedAt / Set default active tab
  // -------------------------
  const sortedTranslations = useMemo(() => {
    return [...translations].sort((a, b) => {
      const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
      const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [translations]);

  const firstSortedValue = sortedTranslations.length
    ? String(sortedTranslations[0].pageTranslationId)
    : "";

  const [activeTab, setActiveTab] = useState<string>(firstSortedValue);
  const userChangedTabRef = useRef(false);

  useEffect(() => {
    if (!firstSortedValue) {
      setActiveTab("");
      userChangedTabRef.current = false;
      return;
    }

    // If currently selected tab no longer exists, reset to first sorted.
    const hasActiveTab = sortedTranslations.some(
      (t) => String(t.pageTranslationId) === activeTab
    );
    if (!hasActiveTab) {
      setActiveTab(firstSortedValue);
      userChangedTabRef.current = false;
      return;
    }

    // Keep active tab synced to "most recent" until user explicitly changes tab.
    if (!userChangedTabRef.current && activeTab !== firstSortedValue) {
      setActiveTab(firstSortedValue);
    }
  }, [sortedTranslations, activeTab, firstSortedValue]);

  // -------------------------
  // No translations for this document
  // -------------------------
  if (sortedTranslations.length === 0) {
    return (
      <Card className="h-full w-full rounded-xl border bg-card p-5 shadow-sm">
        <CardContent className="p-0">
          {m.library.noTranslationsYet}
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="h-full w-full rounded-xl border bg-card p-5 shadow-sm">
      <CardContent className="p-0 h-full flex flex-col">
        {/* -------------------------
        //* Document Title
        //* ------------------------- */}
        <div 
          className="
            inline-flex items-center justify-between 
            gap-3 mb-3
          "
        >
          <h2 className="text-md font-reading font-semibold leading-tight line-clamp-2">
            {document.title}
          </h2>

          <div
            className="
              inline-flex gap-1 items-center 
              text-xs text-muted-foreground
              text-muted-foreground
              opacity-0 group-hover/doc-back:opacity-60
              transition-opacity duration-150
              cursor-pointer select-none
            "
          >
            {m.library.back}
            <RotateCw 
              className="
                h-4 w-4
                transition-transform duration-300 ease-out
                group-hover/doc-back:rotate-180
              "
            />
          </div>
        </div>
        {/* -------------------------
        //* Translations Tabs
        //* ------------------------- */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            userChangedTabRef.current = true;
            setActiveTab(value);
          }}
          className="w-full flex-1 flex flex-col"
        >
          <div className="w-full border-b border-border">
            <TabsList
              className="
                !inline-flex !w-fit
                !justify-start !items-end
                !bg-transparent !p-0 !rounded-none !h-auto
                gap-2
              "
            >
              {sortedTranslations.map((t) => (
                <TabsTrigger
                  key={t.pageTranslationId}
                  value={String(t.pageTranslationId)}
                  className="
                    group/tab relative
                    w-14 shrink-0
                    rounded-t-md rounded-b-none
                    px-2 py-1
                    cursor-pointer
                    bg-transparent

                    border-x border-t border-b-0
                    border-border/50

                    data-[state=active]:-mb-px
                    data-[state=active]:!bg-card
                    data-[state=active]:!border-border
                    data-[state=active]:!border-b-transparent
                    data-[state=active]:shadow-none
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="
                      opacity-30
                      transition-opacity
                      group-data-[state=active]/tab:opacity-100
                    "
                  >
                    <h3 className={`${getLangColors(t.tgtLang).text} font-bold font-ui`}>
                      {t.tgtLang.toUpperCase()}
                    </h3>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>


          {sortedTranslations.map((t) => (
            <TabsContent 
              key={t.pageTranslationId} 
              value={String(t.pageTranslationId)} 
              className="flex h-full flex-col"
            >
              {/* -------------------------
              //* Reading Progress
              //* ------------------------- */}
              <div className="flex items-center gap-2">
                <RadialProgress 
                  value={t.completionPercent} 
                  size={40} 
                  strokeWidth={3} 
                  strokeColor={getLangColors(t.tgtLang).stroke}
                />  

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div>
                      <h3 className="font-ui text-xs text-muted-foreground tracking-wider">
                        {m.library.progress.toUpperCase()}
                      </h3>
                      <div>
                        <span className="text-md font-reading font-semibold">{m.library.pageAbbrev} {t.currentPageNumber}</span>
                        <span className="text-xs font-reading font-normal"> {m.library.of} {document.totalPages}</span>
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={t.completionPercent} 
                    className="h-1 w-full"
                    indicatorClassName={getLangColors(t.tgtLang).progress}
                  />
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <Separator />

                <div className="border border-border bg-subtle p-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-medium tracking-wide text-muted-foreground/80">
                      <span className="rounded-xs border border-border px-2">
                        {m.library.pageAbbrev} {t.currentPageNumber}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {formatRelativeTime(t.lastOpenedAt)}
                      </span>
                    </div>

                    <div className="flex w-full">
                      <ResumeTranslationButton
                        document={document}
                        translation={t}
                        loading={false}
                        className="w-full rounded-none"
                      >
                        <span>
                          {m.library.continueIn}{" "}
                          <span
                            className={`
                              rounded-md border px-1.5 font-semibold
                              ${LANG_COLOR_BY_CODE[toUiLang(t.tgtLang)].chip}
                            `}
                          >
                            {langLabels[toUiLang(t.tgtLang)]}
                          </span>
                        </span>
                      </ResumeTranslationButton>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
