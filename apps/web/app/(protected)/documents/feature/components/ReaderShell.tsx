"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Book, Repeat } from "lucide-react";

import type { LoadedDocumentImage, SavedPage } from "../types/document";
import type { ReaderSession } from "../types/readerSession";
import type { BlurMode } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import { LangLabels, toUiLang, type UiLang, type messages } from "@/app/i18n/messages";

import { ParagraphGrid } from "@/app/(protected)/documents/feature/components/Reader/ParagraphGrid";
import { TextSurface } from "@/app/components/TextSurface";
import { TextSkeleton } from "@/app/(protected)/documents/feature/components/Reader/TextSkeleton";
import { AnchoredPopover } from "@/app/(protected)/documents/feature/components/Annotate/AnchoredPopover";
import { ExplainSkeleton } from "@/app/(protected)/documents/feature/components/Annotate/AnnotateSkeleton";
import { AnnotateCard, type DefineEntry, type ExplainEntry } from "@/app/(protected)/documents/feature/components/Annotate/AnnotateCard";
import { SourceBlurButton } from "@/app/(protected)/documents/feature/components/SourceBlur/SourceBlurButton";
import { BlurModeToggle } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import { HelpPopover } from "@/app/(protected)/documents/feature/components/HelpInfo/HelpPopover";
import { LANG_COLOR_BY_CODE } from "@/types/langs";

export type ReaderMsgs = (typeof messages)[UiLang]["reader"];

type ReaderShellProps = {
  srcLang: string;
  tgtLang: string;
  langLabels: LangLabels;
  isSwapped: boolean;
  onSwapSides: () => void;

  documentId: number | null;
  currentPage: SavedPage | null;
  documentImages: LoadedDocumentImage[];

  session: ReaderSession | null;
  loading: boolean;

  pageIndex: number;
  pageCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;

  // Blur-mode UI
  blurMode: BlurMode;
  onBlurModeChange: (m: BlurMode) => void;

  // Show / hide original 
  sourceBlurEnabled: boolean;
  onSourceBlurEnabledChange: (v: boolean) => void;

  interaction: {
    // ParagraphGrid
    blurredSource: Set<number>;
    setBlurredSource: (updater: Set<number> | ((prev: Set<number>) => Set<number>)) => void;

    sourceHighlightIndices: number[];
    targetHighlightIndices: number[];

    onSourceHover: (idx: number | null) => void;
    onTargetHover: (idx: number | null) => void;
    onTargetWordClick: (i: number, el: HTMLElement) => void;
    targetDisabled: boolean;

    // Popover
    popoverOpen: boolean;
    anchorEl: HTMLElement | null;
    onPopoverOpenChange: (open: boolean) => void;

    // Annotate Card
    explanationLoading: boolean;
    explainData: ExplainEntry | null;
    defineData: DefineEntry | null;
    isBookmarked: boolean;
    onToggleBookmark: () => void;
  };

  // UI language messages
  msgs: ReaderMsgs;
};


export function ReaderShell({
  srcLang,
  tgtLang,
  langLabels,
  isSwapped,
  onSwapSides,
  documentId,
  currentPage,
  documentImages,
  session,
  loading,
  pageIndex,
  pageCount,
  onPrevPage,
  onNextPage,
  blurMode,
  onBlurModeChange,
  sourceBlurEnabled,
  onSourceBlurEnabledChange,
  interaction,
  msgs,
}: ReaderShellProps) {
  const renderLoading = loading || !session;
  const srcLangColors = LANG_COLOR_BY_CODE[toUiLang(srcLang)];
  const tgtLangColors = LANG_COLOR_BY_CODE[toUiLang(tgtLang)];
  const sourcePane = isSwapped
    ? {
        label: langLabels[toUiLang(tgtLang)],
        colors: tgtLangColors,
      }
    : {
        label: langLabels[toUiLang(srcLang)],
        colors: srcLangColors,
      };
  const targetPane = isSwapped
    ? {
        label: langLabels[toUiLang(srcLang)],
        colors: srcLangColors,
      }
    : {
        label: langLabels[toUiLang(tgtLang)],
        colors: tgtLangColors,
      };
  const annotateTgtLang = isSwapped ? srcLang : tgtLang;

  const layoutPresets = {
    12: "gap-x-12 px-6",
    16: "gap-x-16 px-8",
    20: "gap-x-20 px-10",
    24: "gap-x-24 px-12",
    28: "gap-x-28 px-14",
    32: "gap-x-32 px-16",
  } as const;

  const gap = 24;
  const gapAndPad = layoutPresets[gap] ?? layoutPresets[16];


  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TextSurface className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden border-b">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-border/60"
          />
          {/* -------------------------
          * Swap Source / Target Languages Button
          * ------------------------- */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onSwapSides}
            className="
              absolute left-1/2 top-3 z-10 h-9 w-9
              -translate-x-1/2 rounded-full
              border-border/80 bg-background/95
              text-muted-foreground shadow-sm
              transition duration-300 ease-out
              hover:text-foreground
              hover:rotate-180
              motion-reduce:transition-none
            "
            aria-label="Swap source and target roles"
          >
            <Repeat className="h-4 w-4" />
          </Button>
          {/* -------------------------
          * Source / Target Language Headers
          * ------------------------- */}
          <div
            className={`
              shrink-0 grid grid-cols-2 border-b
              text-[16px] font-medium font-ui
              leading-none text-foreground/90
              ${gapAndPad}
            `}
          >
            {/* -------------------------
            * Source Langugage Header
            * ------------------------- */}
            <div className="pt-4 pb-3">
              <div className="flex justify-between">
                <div>
                  {renderLoading ? (
                    <span className="inline-block h-6 w-28 animate-pulse rounded bg-muted-foreground/20" />
                  ) : (
                  <div 
                    className={`
                      rounded-md border px-2 py-1
                      text-md font-ui
                      ${sourcePane.colors.bg} ${sourcePane.colors.text}
                      ${sourcePane.colors.border}
                    `}
                  >
                    {sourcePane.label}
                  </div>
                  )}
                </div>
                {/* -------------------------
                * Source Show / Hide Button
                * ------------------------- */}
                <SourceBlurButton
                  value={sourceBlurEnabled}
                  onChange={onSourceBlurEnabledChange}
                  showLabel={msgs.general.showOriginal}
                  hideLabel={msgs.general.hideOriginal}
                />
              </div>
            </div>
            {/* -------------------------
            * Target Language Header
            * ------------------------- */}
            <div className="pt-4 pb-3">
              <div>
                {renderLoading ? (
                  <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted-foreground/20" />
                ) : (
                  <div 
                    className={`
                      inline-flex items-center
                      rounded-md border px-2 py-1
                      text-md font-ui
                      ${targetPane.colors.bg} ${targetPane.colors.text}
                      ${targetPane.colors.border}
                    `}
                  >
                    {targetPane.label}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------
          * [Source] | [Target] ParagraphGrid
          * ------------------------- */}
          <div className="relative flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar">
            {/* -------------------------
            //* Loading Skeleton || Translation Preview || ParagraphGrid
            //* ------------------------- */}
            <div className="min-h-full">
              {renderLoading ? (
                <div className={`grid grid-cols-2 pt-4 pb-8 ${gapAndPad}`}>
                  <div><TextSkeleton blurClassName="blur-sm" /></div>
                  <div><TextSkeleton /></div>
                </div>
              ) : (
                <ParagraphGrid
                  className="text-[20px] leading-[1.7]"
                  session={session}
                  documentId={documentId ?? 0}
                  pageBlocks={currentPage?.blocks ?? []}
                  documentImages={documentImages}
                  blurMode={blurMode}
                  blurredSource={sourceBlurEnabled ? interaction.blurredSource : new Set()}
                  setBlurredSource={sourceBlurEnabled ? interaction.setBlurredSource : () => {}}
                  sourceHighlightIndices={interaction.sourceHighlightIndices}
                  targetHighlightIndices={interaction.targetHighlightIndices}
                  sourceHighlightClassName={sourcePane.colors.highlight}
                  targetHighlightClassName={targetPane.colors.highlight}
                  isSwapped={isSwapped}
                  onSourceHover={interaction.onSourceHover}
                  onTargetHover={interaction.onTargetHover}
                  onTargetWordClick={interaction.onTargetWordClick}
                  targetDisabled={interaction.targetDisabled}
                  gapAndPad={gapAndPad}
                />
              )}
            </div>
          </div>
        </div>

        {/* -------------------------
        * Footer
        * ------------------------- */}
        <div className="shrink-0 border-t px-4 py-3">
          <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3">
            {/* -------------------------
            * Previous Page
            * ------------------------- */}
            <Button 
              type="button" 
              size="icon" 
              onClick={onPrevPage} 
              disabled={pageIndex <= 0}
              className="
                bg-zinc-50
                border border-primary/30
                text-zinc-500
                hover:bg-zinc-100
                hover:text-zinc-700
                transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {/* -------------------------
            * Blur-mode Toggle
            * ------------------------- */}
            <div className="inline-flex items-center justify-center gap-3">
              <span
                className="text-sm text-muted-foreground"
              >
                Blur
              </span>
              <BlurModeToggle value={blurMode} onChange={onBlurModeChange} />
            </div>
            {/* -------------------------
            * Page Counter
            * ------------------------- */}
            <div className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Book size={14}/>
              {msgs.general.page} {pageCount > 0 ? pageIndex + 1 : 0} / {pageCount}
            </div>
            {/* -------------------------
            * Help Popover
            * ------------------------- */}
            <div className="flex justify-start">
              <HelpPopover />
            </div>
            {/* -------------------------
            * Next Page
            * ------------------------- */}
            <Button 
              type="button" 
              size="icon" 
              onClick={onNextPage} 
              disabled={pageIndex >= pageCount - 1}
              className="
                bg-zinc-50
                border border-primary/30
                text-zinc-500
                hover:bg-zinc-100
                hover:text-zinc-700
                transition-colors
              "
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TextSurface>

      {/* -------------------------
      * Annotation Popover
      * ------------------------- */}
      <AnchoredPopover
        open={interaction.popoverOpen}
        onOpenChange={interaction.onPopoverOpenChange}
        anchorEl={interaction.anchorEl}
        className="w-[30rem] overflow-visible"
      >
        {interaction.explanationLoading || !session ? (
          <ExplainSkeleton />
        ) : (
          <AnnotateCard
            defineData={interaction.defineData}
            explainData={interaction.explainData}
            tgtLang={annotateTgtLang}
            isBookmarked={interaction.isBookmarked}
            onToggleBookmark={interaction.onToggleBookmark}
          />
        )}
      </AnchoredPopover>
    </div>
  );
}
