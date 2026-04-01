"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { MoveRight } from "lucide-react";

import { TableOfContents } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { LangBadge } from "@/app/components/LangBadge"

import { LoadedSection } from "../../types/document"
import { READER_OVERLAY_TOP_CLASS } from "../../lib/layout-constants";
import {
  getCurrentDisplaySectionId,
  getCurrentDisplaySectionIds,
} from "../../lib/sections";

import { LangLabels, type UiLang, type messages } from "@/app/i18n/messages";

type TOCMsgs = (typeof messages)[UiLang]["reader"];


function isCurrentSection(
  currentSectionIds: Set<number>,
  section: LoadedSection,
): boolean {
  return currentSectionIds.has(section.id);
}

export function TOCSheet({
  sections,
  documentTitle,
  documentAuthor,
  srcLang,
  tgtLang,
  langLabels,
  msgs,
  currentPageNumber,
  pageCount,
  onSelectSection,
  onGoToPage,
}: {
  sections: LoadedSection[],
  documentTitle: string,
  documentAuthor?: string | null,
  srcLang: string,
  tgtLang: string,
  langLabels: LangLabels,
  msgs: TOCMsgs,
  currentPageNumber: number,
  pageCount: number,
  onSelectSection: (section: LoadedSection) => void;
  onGoToPage: (pageNumber: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pageInputOverride, setPageInputOverride] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentSectionRef = useRef<HTMLButtonElement | null>(null);
  const pageInput = pageInputOverride ?? (pageCount > 0 ? String(currentPageNumber) : "");

  const requestedPageNumber = Number(pageInput);
  const canGoToPage =
    Number.isInteger(requestedPageNumber) &&
    requestedPageNumber >= 1 &&
    requestedPageNumber <= pageCount;
  const displayPageNumber = pageCount > 0 ? currentPageNumber : 0;
  const progressPercent = pageCount > 0 ? (currentPageNumber / pageCount) * 100 : 0;
  const currentDisplaySectionId = getCurrentDisplaySectionId(currentPageNumber, sections);
  const currentSectionIds = getCurrentDisplaySectionIds(currentPageNumber, sections);

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      const currentSection = currentSectionRef.current;

      if (!container || !currentSection) return;

      const containerRect = container.getBoundingClientRect();
      const currentSectionRect = currentSection.getBoundingClientRect();
      const nextScrollTop =
        container.scrollTop +
        (currentSectionRect.top - containerRect.top) -
        container.clientHeight / 2 +
        currentSectionRect.height / 2;

      container.scrollTo({
        top: Math.max(nextScrollTop, 0),
        behavior: "auto",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [open, currentDisplaySectionId]);

  const handleGoToPage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canGoToPage) return;

    setPageInputOverride(null);
    onGoToPage(requestedPageNumber);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="
            font-ui text-muted-foreground
            border border-border
            bg-muted/60
            hover:text-foreground
            hover:border-foreground/20
          "
        >
          <TableOfContents /> {msgs.toc.contents}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        viewportTopClassName={READER_OVERLAY_TOP_CLASS}
        showOverlay={false}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
        className="
          w-[20rem] font-ui 
          border-2 border-border
        "
      >
        <SheetHeader className="shrink-0 border-b">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <SheetTitle 
              className="
                font-ui text-muted-foreground text-xs
                tracking-wider uppercase
              "
            >
              {msgs.toc.tableOfContents}
            </SheetTitle>
            <div>
              <h2 className="font-reading text-xl font-semibold leading-tight text-foreground">
                {documentTitle}
              </h2>
              {documentAuthor && (
                <span className="min-w-0 font-ui text-sm text-muted-foreground">
                  {documentAuthor}
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-2">
              <LangBadge lang={srcLang} labels={langLabels} useLabel={true}/>
              <MoveRight size={14} />
              <LangBadge lang={tgtLang} labels={langLabels} useLabel={true}/>
            </span>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b px-4 pt-0 pb-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{msgs.toc.readingProgress}</span>
              <span className="shrink-0">
                {msgs.general.page} {displayPageNumber} {msgs.toc.of} {pageCount}
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5 bg-border/80"
              indicatorClassName="bg-primary"
            />
          </div>

          <form
            onSubmit={handleGoToPage}
            className="flex flex-nowrap items-center justify-between gap-3 border-b px-4 py-4"
          >
            <span className="flex items-center gap-2">
              <span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
                {msgs.toc.goToPage}
              </span>
              <Input
                type="number"
                min={1}
                max={pageCount}
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInputOverride(e.target.value)}
                aria-label={msgs.toc.goToPage}
                className="h-8 w-16 shrink-0 px-2 text-center"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                / {pageCount}
              </span>
            </span>
            <Button
              type="submit"
              disabled={!canGoToPage}
              className="
                h-8 shrink-0 rounded-xl px-4 font-semibold
                bg-blue-600 text-primary-foreground
                shadow-sm shadow-primary/40
                transition-transform duration-200 ease-out
                hover:bg-primary
                hover:-translate-y-0.5
                motion-reduce:transform-none
              "
            >
              {msgs.toc.go}
            </Button>
          </form>

          <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols">
              {sections.map((section) => {
                {/* -------------------------
                //* Weight section fonts by depth
                //* ------------------------- */}
                const titleWeightClass =
                  section.depth === 0
                    ? "font-bold text-foreground"
                    : section.depth === 1
                    ? "font-medium text-foreground/95"
                    : "font-normal italic text-foreground/85";

                return (
                  <Button 
                    key={section.id}
                    ref={section.id === currentDisplaySectionId ? currentSectionRef : undefined}
                    onClick={() => {
                      setPageInputOverride(null);
                      onSelectSection(section);
                    }}
                    className={`
                      flex items-start gap-2
                      w-full min-h-12 h-auto rounded-none text-foreground
                      border-b border-border last:border-b-0
                      bg-transparent
                      justify-start whitespace-normal break-words
                      text-left py-3
                      hover:bg-muted-foreground/10
                      ${isCurrentSection(currentSectionIds, section) 
                        ? "bg-blue-300/20 text-blue-60 hover:bg-blue-300/20" 
                        : ""
                      }
                    `}
                  >
                    <span
                      className="grid w-full items-start gap-x-2"
                      style={{
                        gridTemplateColumns:
                          section.depth > 0 ? "auto minmax(0, 1fr)" : "minmax(0, 1fr)",
                      }}
                    >
                      {section.depth > 0 && (
                        <span className="row-start-1 flex items-center gap-1 self-center">
                          {Array.from({ length: section.depth * 4 }).map((_, i) => (
                            <span
                              key={i}
                              className="h-0.5 w-0.5 rounded-full bg-muted-foreground/40"
                            />
                          ))}
                        </span>
                      )}
                      {/* -------------------------
                      //* Section Title
                      //* ------------------------- */}
                      <span
                        className={`min-w-0 row-start-1 ${titleWeightClass}`}
                        style={{ gridColumnStart: section.depth > 0 ? 2 : 1 }}
                      >
                        {section.title}
                      </span>
                      {/* -------------------------
                      //* Page Range
                      //* ------------------------- */}
                      <span
                        className="row-start-2 text-xs text-muted-foreground"
                        style={{ gridColumnStart: section.depth > 0 ? 2 : 1 }}
                      >
                        {section.firstPageNumber === section.lastPageNumber
                          ? `${msgs.toc.pageSingleAbbrev} ${section.firstPageNumber}`
                          : `${msgs.toc.pageRangeAbbrev} ${section.firstPageNumber}-${section.lastPageNumber}`}
                      </span>
                    </span>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
