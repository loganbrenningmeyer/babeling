import type React from "react";

import type { Session } from "@/types/session";
import type { BlurMode } from "@/app/components/SourceBlur/BlurModeToggle";
import type { DefineEntry } from "@/app/components/DefineCard";
import type { ExplainEntry } from "@/app/components/ExplainCard";

import { Pane } from "@/app/components/Pane";
import { TextSurface } from "@/app/components/TextSurface";
import { SourceBlurButton } from "@/app/components/SourceBlur/SourceBlurButton";
import { ParagraphGrid } from "@/app/components/ParagraphGrid";
import { TextSkeleton } from "@/app/components/TextSkeleton";
import { AnchoredPopover } from "@/app/components/AnchoredPopover";
import { ExplainSkeleton } from "@/app/components/ExplainSkeleton";
import { DefineCard } from "@/app/components/DefineCard";
import { ExplainCard } from "@/app/components/ExplainCard";
import { PronounceButton } from "@/app/components/Pronounce/PronounceButton";

type ReaderPaneProps = {
  paneHeightClassName: string;
  paneWrapperClassName: string;

  sourceFile: File | null;
  selectedSampleLabel: string | null;

  srcLangLabel: string;
  tgtLangLabel: string;

  sourceBlurEnabled: boolean;
  onSourceBlurEnabledChange: (value: boolean) => void;

  translationLoading: boolean;
  session: Session | null;

  blurMode: BlurMode;
  blurredSource: Set<number>;
  setBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;
  emptyBlurredSource: Set<number>;
  noopSetBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;

  sourceHighlightIndices: number[];
  targetHighlightIndices: number[];
  onSourceHover: (idx: number | null) => void;
  onTargetHover: (idx: number | null) => void;
  onTargetWordClick: (idx: number, el: HTMLElement) => void;

  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  anchorEl: HTMLElement | null;

  explanationLoading: boolean;
  defineData: DefineEntry | null;
  explainData: ExplainEntry | null;
  tgtLang: string;

  toolbar: React.ReactNode;
};

function renderReaderTitle(sourceFile: File | null, selectedSampleLabel: string | null) {
  if (sourceFile) {
    const cleanedName = sourceFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
    return (
      <div className="flex w-full justify-center pt-6 pb-5 border-b font-reading font-normal uppercase tracking-[0.12em] leading-none text-[22px] text-muted-foreground">
        {cleanedName}
      </div>
    );
  }

  if (selectedSampleLabel) {
    return (
      <div className="flex w-full justify-center pt-6 pb-5 border-b font-reading font-normal uppercase tracking-[0.12em] leading-none text-[22px] text-muted-foreground">
        {selectedSampleLabel}
      </div>
    );
  }

  return null;
}

export function ReaderPane({
  paneHeightClassName,
  paneWrapperClassName,
  sourceFile,
  selectedSampleLabel,
  srcLangLabel,
  tgtLangLabel,
  sourceBlurEnabled,
  onSourceBlurEnabledChange,
  translationLoading,
  session,
  blurMode,
  blurredSource,
  setBlurredSource,
  emptyBlurredSource,
  noopSetBlurredSource,
  sourceHighlightIndices,
  targetHighlightIndices,
  onSourceHover,
  onTargetHover,
  onTargetWordClick,
  popoverOpen,
  onPopoverOpenChange,
  anchorEl,
  explanationLoading,
  defineData,
  explainData,
  tgtLang,
  toolbar,
}: ReaderPaneProps) {
  return (
    <div className={paneWrapperClassName}>
      <Pane className={`${paneHeightClassName} flex flex-col p-0 shadow-2xl`} contentClassName="p-0">
        <div className="flex-1 min-h-0">
          <TextSurface className="relative h-full flex flex-col overflow-hidden pt-0">
            <div>{renderReaderTitle(sourceFile, selectedSampleLabel)}</div>

            <div className="relative flex-1 min-h-0 flex flex-col border-b">
              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.25 bg-border" />

              <div className="grid grid-cols-2 text-[18px] font-medium">
                <div className="px-6 relative">
                  <div className="pt-4">
                    <div className="flex items-center">
                      <span className="inline-flex flex-col">
                        <span className="pb-2 text-muted-foreground">{srcLangLabel}</span>
                        <span className="relative z-10 h-1 w-full bg-blue-300" />
                      </span>
                      <div className="absolute right-6 inset-y-0 flex items-center">
                        <SourceBlurButton
                          value={sourceBlurEnabled}
                          onChange={onSourceBlurEnabledChange}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="-mt-0.5 h-0.5 bg-foreground/10" />
                </div>

                <div className="px-6">
                  <div className="pt-4">
                    <span className="inline-flex flex-col">
                      <span className="pb-2">{tgtLangLabel}</span>
                      <span className="relative z-10 h-1 w-full bg-orange-300" />
                    </span>
                  </div>
                  <div className="-mt-0.5 h-0.5 bg-foreground/10" />
                </div>
              </div>

              <div className="relative flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar pb-8">
                {translationLoading || !session ? (
                  <div className="grid grid-cols-2 p-8 pt-4">
                    <div className="pr-8">
                      <TextSkeleton blurClassName="blur-sm" />
                    </div>
                    <div className="pl-8">
                      <TextSkeleton />
                    </div>
                  </div>
                ) : (
                  <ParagraphGrid
                    session={session}
                    blurMode={blurMode}
                    blurredSource={sourceBlurEnabled ? blurredSource : emptyBlurredSource}
                    setBlurredSource={sourceBlurEnabled ? setBlurredSource : noopSetBlurredSource}
                    sourceHighlightIndices={sourceHighlightIndices}
                    targetHighlightIndices={targetHighlightIndices}
                    onSourceHover={onSourceHover}
                    onTargetHover={onTargetHover}
                    onTargetWordClick={onTargetWordClick}
                    targetDisabled={popoverOpen}
                    className="text-[20px] leading-[1.5]"
                  />
                )}
              </div>
            </div>

            {toolbar}
          </TextSurface>
        </div>
      </Pane>

      <AnchoredPopover
        open={popoverOpen}
        onOpenChange={onPopoverOpenChange}
        anchorEl={anchorEl}
        className="w-[min(520px,92vw)]"
      >
        {explanationLoading || !session ? (
          <ExplainSkeleton />
        ) : (
          <div className="p-4 space-y-4 font-ui">
            {defineData && <DefineCard data={defineData} tgtLang={tgtLang} />}
            <div className="h-px bg-border" />
            {explainData && <ExplainCard data={explainData} />}
            <div className="h-px w-full bg-border" />
            {defineData && (
              <div className="flex w-full justify-between gap-2">
                <PronounceButton
                  text={defineData.sentence}
                  label="Listen to sentence"
                  tgtLang={tgtLang}
                  iconClassName="h-4 w-4"
                />
                <PronounceButton
                  text={defineData.paragraph}
                  label="Listen to paragraph"
                  tgtLang={tgtLang}
                  iconClassName="h-4 w-4"
                />
              </div>
            )}
          </div>
        )}
      </AnchoredPopover>
    </div>
  );
}
