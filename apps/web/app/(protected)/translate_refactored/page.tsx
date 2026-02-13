"use client";

import { useCallback, useMemo, useState } from "react";

import { useAppUser } from "@/components/AppUserProvider";
import type { BlurMode } from "@/app/components/SourceBlur/BlurModeToggle";
import { useSourceRevealNav } from "@/app/components/SourceBlur/useSourceRevealNav";

import { LANGS, getLangLabel } from "./constants/languages";
import { useReadingSession } from "./hooks/useReadingSession";
import { usePopoverExplain } from "./hooks/usePopoverExplain";
import { useKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import { TranslateInputPane } from "./components/TranslateInputPane";
import { ReaderPane } from "./components/ReaderPane";
import { ReaderToolbar } from "./components/ReaderToolbar";

export default function TranslateRefactoredRoute() {
  const { error } = useAppUser();

  if (error) {
    return <div className="p-6 text-sm text-red-600">Account error: {error}</div>;
  }

  return <TranslateRefactoredPage />;
}

function TranslateRefactoredPage() {
  const {
    sourceText,
    setSourceText,
    sourceFile,
    setSourceFile,
    srcLang,
    setSrcLang,
    tgtLang,
    setTgtLang,
    handleSwapLanguages,

    sampleId,
    setSampleId,
    sampleLoading,
    sampleOptions,
    selectedSample,
    handleSampleSelect,

    session,
    pages,
    pageId,
    translationLoading,
    showAligned,
    blurredSource,
    setBlurredSource,
    navSentId,
    setNavSentId,
    navParId,
    setNavParId,

    canTranslate,
    startReadingSession,
    goPrevPage,
    goNextPage,
  } = useReadingSession();

  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(false);

  const emptyBlurredSource = useMemo(() => new Set<number>(), []);
  const noopSetBlurredSource = useCallback<React.Dispatch<React.SetStateAction<Set<number>>>>(
    (value) => {
      // no-op setter used when source blur is disabled
      void value;
    },
    []
  );

  const popover = usePopoverExplain({
    session,
    srcLang,
    tgtLang,
    sourceBlurEnabled,
    setBlurredSource,
  });

  const activeSourceIndex = popover.popoverOpen ? null : popover.hoveredSourceIndex;
  const activeTargetIndex = popover.popoverOpen
    ? popover.lockedTargetIndex
    : popover.hoveredTargetIndex;

  const activeAlignedSource = popover.popoverOpen
    ? popover.lockedSourceIndices
    : popover.hoveredTargetIndex !== null
      ? (session?.align.tgtToSrc[popover.hoveredTargetIndex] ?? [])
      : [];

  const activeAlignedTarget =
    activeSourceIndex !== null ? (session?.align.srcToTgt[activeSourceIndex] ?? []) : [];

  const { prev, next } = useSourceRevealNav({
    session,
    sourceBlurEnabled,
    blurredSource,
    setBlurredSource,
    navSentId,
    setNavSentId,
    navParId,
    setNavParId,
  });

  const handleStartReadingSession = useCallback(async () => {
    popover.clearExplain();
    popover.resetInteraction();
    await startReadingSession();
  }, [popover, startReadingSession]);

  const handlePrevPage = useCallback(async () => {
    popover.resetInteraction();
    await goPrevPage();
  }, [goPrevPage, popover]);

  const handleNextPage = useCallback(async () => {
    popover.resetInteraction();
    await goNextPage();
  }, [goNextPage, popover]);

  useKeyboardNavigation({
    showAligned,
    popoverOpen: popover.popoverOpen,
    onPrevPage: handlePrevPage,
    onNextPage: handleNextPage,
    onPrevSentence: () => prev("sentence"),
    onNextSentence: () => next("sentence"),
    onPrevParagraph: () => prev("paragraph"),
    onNextParagraph: () => next("paragraph"),
  });

  const paneHeightClassName = "h-[80vh]";
  const paneWrapperClassName = `w-full ${paneHeightClassName} px-12`;

  if (!showAligned && !translationLoading) {
    return (
      <TranslateInputPane
        paneHeightClassName={paneHeightClassName}
        paneWrapperClassName={paneWrapperClassName}
        languages={LANGS}
        srcLang={srcLang}
        tgtLang={tgtLang}
        onSrcLangChange={setSrcLang}
        onTgtLangChange={setTgtLang}
        onSwapLanguages={handleSwapLanguages}
        sampleId={sampleId}
        sampleOptions={sampleOptions}
        sampleLoading={sampleLoading}
        onSampleSelect={handleSampleSelect}
        sourceText={sourceText}
        onSourceTextChange={(value) => {
          setSourceText(value);
          if (sampleId) setSampleId("");
        }}
        sourceFile={sourceFile}
        onSourceFileChange={(file) => {
          setSourceFile(file);
          if (file) setSampleId("");
        }}
        sourcePlaceholder={`Type some ${getLangLabel(srcLang)} text...`}
        canTranslate={canTranslate}
        translationLoading={translationLoading}
        onStartReadingSession={handleStartReadingSession}
      />
    );
  }

  return (
    <ReaderPane
      paneHeightClassName={paneHeightClassName}
      paneWrapperClassName={paneWrapperClassName}
      sourceFile={sourceFile}
      selectedSampleLabel={selectedSample?.label ?? null}
      srcLangLabel={getLangLabel(srcLang)}
      tgtLangLabel={getLangLabel(tgtLang)}
      sourceBlurEnabled={sourceBlurEnabled}
      onSourceBlurEnabledChange={setSourceBlurEnabled}
      translationLoading={translationLoading}
      session={session}
      blurMode={blurMode}
      blurredSource={blurredSource}
      setBlurredSource={setBlurredSource}
      emptyBlurredSource={emptyBlurredSource}
      noopSetBlurredSource={noopSetBlurredSource}
      sourceHighlightIndices={[
        ...(activeSourceIndex !== null ? [activeSourceIndex] : []),
        ...activeAlignedSource,
      ]}
      targetHighlightIndices={[
        ...(activeTargetIndex !== null ? [activeTargetIndex] : []),
        ...activeAlignedTarget,
      ]}
      onSourceHover={popover.handleSourceHover}
      onTargetHover={popover.handleTargetHover}
      onTargetWordClick={popover.handleTargetWordClick}
      popoverOpen={popover.popoverOpen}
      onPopoverOpenChange={popover.handlePopoverOpenChange}
      anchorEl={popover.anchorEl}
      explanationLoading={popover.explanationLoading}
      defineData={popover.defineData}
      explainData={popover.explainData}
      tgtLang={tgtLang}
      toolbar={
        <ReaderToolbar
          blurMode={blurMode}
          onBlurModeChange={setBlurMode}
          pageId={pageId}
          pagesCount={pages.length}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      }
    />
  );
}
