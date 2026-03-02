"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Book, Clock, RotateCw } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadialProgress } from "@/app/components/RadialProgress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ResumeTranslationButton } from "./ResumeTranslationButton";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";

import { capitalizeWords, formatRelativeTime } from "@/lib/string";
import { LANG_COLOR_BY_CODE } from "@/types/langs";


export function DocumentBack({
  document,
  translations,
  loading,
  error,
}: {
  document: LibraryDocument,
  translations: LibraryTranslation[],
  loading: boolean,
  error: string | null,
}) {
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
          No translations yet
        </CardContent>
      </Card>
    );
  }

  {/* -------------------------
  //* Language Colors
  //* ------------------------- */}
  function getLangColors(lang: string) {
    return LANG_COLOR_BY_CODE[lang as keyof typeof LANG_COLOR_BY_CODE];
  }

  return (
    <Card className="h-full w-full rounded-xl border bg-card p-5 pb-2 shadow-sm">
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
          <h2 className="text-md font-reading font-medium leading-tight">
            {capitalizeWords(document.title)}
          </h2>

          <div
            className="
              inline-flex gap-1 items-center 
              text-xs text-muted-foreground
              text-muted-foreground
              opacity-0 group-hover/doc-back:opacity-60
              transition-opacity duration-150
              cursor-pointer
            "
          >
            Back
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
          <div className="w-full border-b-2 border-border">
            <TabsList className="
              !inline-flex !w-fit
              !justify-start !items-end
              !bg-transparent !p-0 !rounded-none !h-auto
              gap-2
            ">
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
                    border border-transparent
                    -mb-0.5

                    data-[state=active]:bg-transparent
                    data-[state=active]:border-border border-2
                    data-[state=active]:border-b-transparent
                    data-[state=active]:shadow-none
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="
                    opacity-30
                    transition-opacity
                    group-data-[state=active]/tab:opacity-100
                  ">
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
              className="mt-2 flex flex-col h-full space-y-4"
            >
              {/* -------------------------
              //* Reading Progress
              //* ------------------------- */}
              <div className="flex items-center gap-2">
                <RadialProgress 
                  value={t.completionPercent} 
                  size={50} 
                  strokeWidth={4} 
                  strokeColor={getLangColors(t.tgtLang).stroke}
                />  

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <div>
                      <h2 className="font-ui text-xs text-muted-foreground tracking-wider">
                        {"Progress".toUpperCase()}
                      </h2>
                      <div>
                        <span className="text-lg font-reading font-semibold">p. {t.currentPageNumber}</span>
                        <span className="text-sm font-reading font-normal"> of {document.totalPages}</span>
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

              <Separator />

              <div 
                className="
                  flex items-center justify-between 
                  mt-auto gap-4 whitespace-nowrap
                "
              >
                <div className="flex flex-col gap-2">
                  <ResumeTranslationButton 
                    document={document}
                    translation={t}
                    loading={false}
                  >
                    Resume reading
                  </ResumeTranslationButton>
                  
                  <div
                    className="
                      w-full flex justify-center gap-4
                      text-xs text-muted-foreground/60
                    "
                  >
                    <span className="flex items-center gap-1">
                      <Book size={12}/>
                      p. {t.currentPageNumber} / {document.totalPages}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12}/>
                      {formatRelativeTime(t.lastOpenedAt)}
                    </span>
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
