"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";

import { SourceBlurButton } from "@/app/components/SourceBlur/SourceBlurButton";
import { BlurMode, BlurModeToggle } from "@/app/components/SourceBlur/BlurModeToggle";
import { DefineEntry, DefineCard } from "@/app/components/DefineCard";
import { ExplainEntry, ExplainCard } from "@/app/components/ExplainCard";
import { Pane } from "@/app/components/Pane";
import { AppTextarea } from "@/app/components/AppTextarea";
import { TextSurface } from "@/app/components/TextSurface";
import { AnchoredPopover } from "@/app/components/AnchoredPopover";
import { ExplainSkeleton } from "@/app/components/ExplainSkeleton";
import { TextSkeleton } from "@/app/components/TextSkeleton";
import { ParagraphGrid } from "@/app/components/ParagraphGrid";
import { UploadSurface } from "@/app/components/UploadSurface";
import { HelpPopover } from "@/app/components/HelpInfo/HelpPopover";
import { useSourceRevealNav } from "@/app/components/SourceBlur/useSourceRevealNav";
import { SAMPLE_TEXTS_BY_LANG } from "@/app/translate/sampleTexts";
import { PronounceButton } from "../components/PronounceButton";


const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "de", label: "German" },
];

export function getLangLabel(code: string) {
  return LANGS.find((l) => l.code === code)?.label ?? code;
}

export type Session = {
  sourceText: string;
  targetText: string;

  src: {
    words: string[];
    spaces: string[];
    sentIds: number[];
    sentToParIds: Record<number, number>;
    sentToWordIds: Record<number, number[]>;
    parIds: number[];
    parToSentIds: Record<number, number[]>;
    parToWordIds: Record<number, number[]>;
  };

  tgt: {
    words: string[];
    spaces: string[];
    sentIds: number[];
  };

  align: {
    srcToTgt: Record<number, number[]>;
    tgtToSrc: Record<number, number[]>;
  };

  state: {
    blurredSource: Set<number>;
    navSentId: number;
    navParId: number;
  };
};

export default function Translate() {
  // -------------------------
  // Core state
  // -------------------------
  const [sourceText, setSourceText] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("fr");
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Cache translated / aligned pages
  const [pages, setPages] = useState<string[]>([]);
  const [pageId, setPageId] = useState<number>(0);
  const pageCache = useRef<Map<number, Session>>(new Map());

  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);
  // Blurred Source
  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(false);
  const emptyBlurredSource = useRef<Set<number>>(new Set());
  const noopSetBlurredSource = (_: Set<number> | ((prev: Set<number>) => Set<number>)) => {};
  // Lock target/source when Popover is showing
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);
  const [targetLocked, setTargetLocked] = useState(false);
  // Current sentence/paragraph for arrow navigation
  const [navSentId, setNavSentId] = useState<number>(-1);
  const [navParId, setNavParId] = useState<number>(-1);

  // -------------------------
  // Popover / interaction state
  // -------------------------
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(
    null
  );
  const [hoveredTargetIndex, setHoveredTargetIndex] = useState<number | null>(
    null
  );

  // -------------------------
  // Input files state
  // -------------------------
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sampleId, setSampleId] = useState("");
  const [sampleLoading, setSampleLoading] = useState(false);

  // -------------------------
  // Derived values
  // -------------------------
  const sampleOptions = SAMPLE_TEXTS_BY_LANG[srcLang] ?? [];
  const selectedSample = sampleOptions.find((entry) => entry.id === sampleId) ?? null;
  const activeSourceIndex = popoverOpen ? null : hoveredSourceIndex;
  const activeTargetIndex = popoverOpen ? lockedTargetIndex : hoveredTargetIndex;

  const activeAlignedSource =
    popoverOpen
      ? lockedSourceIndices
      : hoveredTargetIndex !== null
        ? (session?.align.tgtToSrc[hoveredTargetIndex] ?? [])
        : [];
    
  const activeAlignedTarget =
    activeSourceIndex !== null
      ? (session?.align.srcToTgt[activeSourceIndex] ?? [])
      : [];
  const canTranslate = sourceText.trim().length > 0 || !!sourceFile;

  // -------------------------
  // Handlers
  // -------------------------
  async function startReadingSession() {
    if (!sourceText.trim() && !sourceFile) return;

    const fullText = sourceFile ? await sourceFile.text() : sourceText;

    // Split full text into pages
    const pages_res = await fetch("/api/split_pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText }),
    });
    const pages_data = await pages_res.json();
    const newPages = pages_data.pages;
    setPages(pages_data.pages)
    setPageId(0);

    // Reset session state
    pageCache.current.clear();
    setSession(null);
    setNavSentId(-1);
    setNavParId(-1);
    setExplainData(null);
    setDefineData(null);

    setTargetLocked(false);
    setLockedSourceIndices([]);
    setPopoverOpen(false);

    // Translate and align source text
    await loadPageSession(0, newPages);
  }

  function handleSwapLanguages() {
    const nextSrc = tgtLang;
    const nextTgt = srcLang;
    setSrcLang(nextSrc);
    setTgtLang(nextTgt);
  }

  async function handleSampleSelect(nextId: string) {
    setSampleId(nextId);
    if (!nextId) return;

    const sample = sampleOptions.find((entry) => entry.id === nextId);
    if (!sample) return;

    setSampleLoading(true);
    try {
      const res = await fetch(
        `/texts/${encodeURIComponent(srcLang)}/${encodeURIComponent(sample.filename)}`
      );
      if (!res.ok) throw new Error("Failed to load sample text");
      const text = await res.text();
      setSourceFile(null);
      setSourceText(text);
    } catch (err) {
      console.error(err);
    } finally {
      setSampleLoading(false);
    }
  }

  async function loadPageSession(pid: number, pagesArg?: string[]) {
    // immediately reset UI state before loading cache
    setNavSentId(-1);
    setNavParId(-1);
    setHoveredSourceIndex(null);
    setHoveredTargetIndex(null);
    setTargetLocked(false);
    setLockedTargetIndex(null);
    setLockedSourceIndices([]);

    // Take optional pagesArg to avoid async race conditions setting pages
    const pagesLocal = pagesArg ?? pages;

    // Check cache for page ID
    const cachedSession = pageCache.current.get(pid);
    if (cachedSession) {
      setSession(cachedSession);
      setBlurredSource(new Set(cachedSession.state.blurredSource));
      setNavSentId(cachedSession.state.navSentId);
      setNavParId(cachedSession.state.navParId);
      setShowAligned(true);
      setPageId(pid);
      return;
    }

    // If page not cached, translate and align
    const pageText = pagesLocal[pid] ?? "";
    if (!pageText.trim()) return;
    setPageId(pid);
    
    // Cache page's session
    const sess = await translateAndAlign(pageText);
    if (sess) {
      pageCache.current.set(pid, sess);
      setSession(sess);
      setBlurredSource(new Set(sess.src.words.map((_, i) => i)));
      setShowAligned(true);
    }

  }

  async function translateAndAlign(text: string) {
    if (!text.trim()) return;

    setTranslationLoading(true);

    // Translate
    const translate_res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: text, src_lang: srcLang, tgt_lang: tgtLang }),
    });
    const translate_data = await translate_res.json();

    // Update normalized source text / get translated target
    const source = translate_data.source;
    const target = translate_data.target;

    // Align
    const align_res = await fetch("/api/align", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        target,
        src_lang: srcLang,
        tgt_lang: tgtLang,
      }),
    });
    const align_data = await align_res.json();

    // Update session
    const sess: Session = {
      sourceText: source,
      targetText: target,
      src: {
        words: align_data.src_words,
        spaces: align_data.src_spaces,
        sentIds: align_data.src_sent_ids,
        sentToParIds: align_data.src_sent_to_par_ids,
        sentToWordIds: align_data.src_sent_to_word_ids,
        parIds: align_data.src_par_ids,
        parToSentIds: align_data.src_par_to_sent_ids,
        parToWordIds: align_data.src_par_to_word_ids,
      },
      tgt: {
        words: align_data.tgt_words,
        spaces: align_data.tgt_spaces,
        sentIds: align_data.tgt_sent_ids,
      },
      align: {
        srcToTgt: align_data.src_to_tgt,
        tgtToSrc: align_data.tgt_to_src,
      },
      state: {
        blurredSource: new Set(align_data.src_words.map((_: string, i: number) => i)),
        navSentId: -1,
        navParId: -1,
      }
    };

    setTranslationLoading(false);
    return sess;
  }

  async function handleTargetWordClick(i: number, el: HTMLElement) {
    if (!session) return;
    if (targetLocked) return;
    setTargetLocked(true);

    // -------------------------
    // Unblur aligned English words
    // -------------------------
    const srcIdxs = session.align.tgtToSrc[i] ?? [];

    setLockedTargetIndex(i);
    setLockedSourceIndices(srcIdxs);
    setHoveredTargetIndex(i);

    if (sourceBlurEnabled) {
      setBlurredSource(prev => {
        const next = new Set(prev);
        for (const idx of srcIdxs) next.delete(idx);
        return next;
      })
    }

    // -------------------------
    // Store target word idx / where it is
    // -------------------------
    setAnchorEl(el);
    setPopoverOpen(true);

    // -------------------------
    // Get explanation / definition
    // -------------------------
    setExplanationLoading(true);

    const res = await fetch("/api/define_and_explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        src_words: session.src.words,
        tgt_words: session.tgt.words,
        src_spaces: session.src.spaces,
        tgt_spaces: session.tgt.spaces,
        src_sent_ids: session.src.sentIds,
        tgt_sent_ids: session.tgt.sentIds,
        tgt_to_src: session.align.tgtToSrc,
        tgt_idx: i,
        src_lang: srcLang,
        tgt_lang: tgtLang,
      }),
    });
    const data = await res.json();

    setExplainData({
      explanation: data.explanation,
      examples: data.examples,
    });
    setDefineData({
      word: data.word,
      sentence: data.sentence,
      lemma: data.lemma,
      pos: data.pos,
      ipa_lemma: data.ipa_lemma,
      ipa_form: data.ipa_form,
      gloss: data.gloss,
    });

    setExplanationLoading(false);
  }
  
  // -------------------------
  // Hover Highlighting
  // -------------------------
  const handleSourceHover = (idx: number | null) => {
    if (popoverOpen) return;        // lock
    setHoveredSourceIndex(idx);
  };

  const handleTargetHover = (idx: number | null) => {
    if (popoverOpen) return;        // lock
    setHoveredTargetIndex(idx);
  };

  // -------------------------
  // Text blur helper functions
  // -------------------------
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

  // -------------------------
  // Page navigation
  // -------------------------
  function updateCachedState(pid: number) {
    if (!session) return;

    const updated: Session = {
      ...session,
      state: {
        blurredSource: new Set(blurredSource),
        navSentId: navSentId,
        navParId: navParId,
      },
    };

    pageCache.current.set(pid, updated);
    setSession(updated);
  }

  async function goPrevPage() {
    const prev = pageId - 1;
    if (prev < 0) return;
    updateCachedState(pageId);
    await loadPageSession(prev);
  }

  async function goNextPage() {
    const next = pageId + 1;
    if (next >= pages.length) return;
    updateCachedState(pageId);
    await loadPageSession(next);
  }

  // -------------------------
  // Sample selection
  // -------------------------
  useEffect(() => {
    setSampleId("");
  }, [srcLang]);

  // -------------------------
  // Arrow Key Navigation
  // -------------------------
  useEffect(() => {
    if (!showAligned) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (popoverOpen) return;

      const isArrow =
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown";

      if (!isArrow) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const ae = document.activeElement;
      if (ae instanceof HTMLElement) ae.blur();

      // Page navigation
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "ArrowLeft":
            goPrevPage();
            return;
          case "ArrowRight":
            goNextPage();
            return;
        }
      }

      // Sentence / Paragraph navigation
      switch (e.key) {
        case "ArrowLeft":
          prev("sentence");
          break;
        case "ArrowRight":
          next("sentence");
          break;
        case "ArrowUp":
          prev("paragraph");
          break;
        case "ArrowDown":
          next("paragraph");
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
    };
  }, [
    showAligned,
    popoverOpen,
    prev,
    next,
  ]);


  // -------------------------
  // Render
  // -------------------------
  const PANE_H = "h-[80vh]"
  const PANE_DIV = `w-full ${PANE_H} px-12`

  return (
    <div>
      {/* -------------------------
      //* Source Text Input 
      //* ------------------------- */}
      {!showAligned && !translationLoading ? (
        <div className={PANE_DIV}>
          <Pane className={`${PANE_H} flex flex-col min-h-0 bg-muted font-ui`}>
            {/* -------------------------
            //* Source / Target Selectors
            //* ------------------------- */}
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm mb-4">
              <div className="flex items-center gap-4">
                {/* Source Language Selector */}
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground pb-1">
                    Original
                  </div>
                  <select
                    className="
                      w-full h-10 rounded-lg border border-border bg-muted/40 px-3 
                      text-sm font-semibold 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    "
                    value={srcLang}
                    onChange={(e) => setSrcLang(e.target.value)}
                    disabled={translationLoading}
                  >
                  {LANGS.map((lang) => {
                    const isDisabled = lang.code === tgtLang;
                    return (
                      <option
                        key={lang.code}
                        value={lang.code}
                        disabled={isDisabled}
                        className={!isDisabled ? "font-semibold" : "font-normal"}
                      >
                        {lang.label}
                      </option>
                    );
                  })}
                  </select>
                </div>

                <div className="hidden sm:flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="
                      h-11 w-11 rounded-full border border-border/70 bg-muted 
                      text-foreground shadow-sm 
                      transition-colors hover:bg-foreground/10 hover:text-foreground/90
                    "
                    onClick={handleSwapLanguages}
                    aria-label="Swap source and target languages"
                    disabled={translationLoading}
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Target Language Selector */}
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground pb-1">
                    Translation
                  </div>
                  <select
                    className="
                      w-full h-10 rounded-lg border border-border bg-muted/40 px-3 
                      text-sm font-semibold 
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    "
                    value={tgtLang}
                    onChange={(e) => setTgtLang(e.target.value)}
                    disabled={translationLoading}
                  >
                  {LANGS.map((lang) => {
                    const isDisabled = lang.code === srcLang;
                    return (
                      <option
                        key={lang.code}
                        value={lang.code}
                        disabled={isDisabled}
                        className={!isDisabled ? "font-semibold" : "font-normal"}
                      >
                        {lang.label}
                      </option>
                    );
                  })}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground pb-1">
                  Sample text
                </div>
                <select
                  className="
                    w-full h-10 rounded-lg border border-border bg-muted/40 px-3 
                    text-sm font-semibold 
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  "
                  value={sampleId}
                  onChange={(e) => handleSampleSelect(e.target.value)}
                  disabled={translationLoading || sampleLoading || sampleOptions.length === 0}
                >
                  <option value="">Select a sample...</option>
                  {sampleOptions.map((sample) => (
                    <option key={sample.id} value={sample.id} className="font-semibold">
                      {sample.label}
                    </option>
                  ))}
                </select>
                {sampleLoading && (
                  <div className="pt-1 text-xs text-muted-foreground">
                    Loading sample...
                  </div>
                )}
              </div>
            </div>

            {/* -------------------------
            //* Source Text Inputs
            //* ------------------------- */}
            {/* Input Box */}
            <div className="font-ui flex-1 min-h-0">
              <AppTextarea
                className="h-full min-h-0 overflow-y-auto"
                value={sourceText}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  if (sampleId) setSampleId("");
                }}
                placeholder={`Type some ${getLangLabel(srcLang)} text...`}
              />
            </div>
            {/* Upload Card */}
            <div className="pt-3 shrink-0">
              <UploadSurface 
                className="h-36"
                file={sourceFile}
                onFileChange={(file) => {
                  setSourceFile(file);
                  if (file) setSampleId("");
                }}
              />
            </div>
            
            {/* -------------------------
            //* Translate Button
            //* ------------------------- */}
            <div className="font-ui pt-6 shrink-0 flex flex-col items-center gap-2">
              <Button
                onClick={startReadingSession}
                disabled={translationLoading || !srcLang || !tgtLang || !canTranslate}
                className="
                  group
                  relative
                  shadow
                  w-full h-12
                  transition
                  hover:bg-primary
                  hover:shadow-md
                  hover:-translate-y-[1px]
                  disabled:shadow-none
                  disabled:translate-y-0
                "
              >
                <span className="relative font-semibold">
                  Translate
                  <span
                    className="
                      absolute left-0 -bottom-1
                      h-[2px] w-full
                      bg-current
                      origin-left scale-x-0
                      transition-transform duration-300
                      group-hover:scale-x-100
                    "
                  />
                </span>
              </Button>
              {!canTranslate && (
                <div className="text-xs text-muted-foreground">
                  Paste text or upload a file to translate.
                </div>
              )}

            </div>
          </Pane>
        </div>
      ) : (
        <>
          {/* -------------------------
          //* Source / Target HoverText
          //* ------------------------- */}
          <div className={PANE_DIV}>
            <Pane className={`${PANE_H} flex flex-col p-0 shadow-2xl`} contentClassName="p-0">
              <div className="flex-1 min-h-0">
                {/* -------------------------
                //* --------- [Title] ----------
                //* [Source Text] | [Target Text]
                //* ------------------------- */}
                <TextSurface className="relative h-full flex flex-col overflow-hidden pt-0">
                  {/* Title Header */}
                  <div>
                    {sourceFile ? (
                      <div className="
                      flex w-full justify-center
                      pt-6 pb-5
                      border-b 
                      font-reading font-normal
                      uppercase tracking-[0.12em] leading-none
                      text-[18px] text-muted-foreground 
                      "
                      >
                        {sourceFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ")}
                      </div>
                    ) : selectedSample ? (
                      <div className="
                      flex w-full justify-center
                      pt-6 pb-5
                      border-b 
                      font-reading font-normal
                      uppercase tracking-[0.12em] leading-none
                      text-[18px] text-muted-foreground 
                      "
                      >
                        {selectedSample.label}
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div className="relative flex-1 min-h-0 flex flex-col border-b">
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.25 bg-border" />

                    {/* -------------------------
                    //* Source / Target Headers
                    //* ------------------------- */}
                    <div className="grid grid-cols-2 text-[18px] font-medium">
                      {/* Source Header */}
                      <div className="px-6 relative">
                        <div className="pt-4">
                          <div className="flex items-center">
                            <span className="inline-flex flex-col">
                              <span className="pb-2 text-muted-foreground">{getLangLabel(srcLang)}</span>
                              <span className="relative z-10 h-1 w-full bg-blue-300" />
                            </span>
                            <div className="absolute right-6 inset-y-0 flex items-center" >
                              {/* Reveal/Hide Full Source Text */}
                              <SourceBlurButton 
                                value={sourceBlurEnabled}
                                onChange={setSourceBlurEnabled}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="-mt-0.5 h-0.5 bg-foreground/10" />
                      </div>
                      {/* Target Header */}
                      <div className="px-6">
                        <div className="pt-4">
                          <span className="inline-flex flex-col">
                            <span className="pb-2">{getLangLabel(tgtLang)}</span>
                            <span className="relative z-10 h-1 w-full bg-orange-300" />
                          </span>
                        </div>
                        <div className="-mt-0.5 h-0.5 bg-foreground/10" />
                      </div>
                    </div>

                    {/* -------------------------
                    //* ParagraphGrid
                    //* ------------------------- */}
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
                          blurredSource={sourceBlurEnabled ? blurredSource : emptyBlurredSource.current}
                          setBlurredSource={sourceBlurEnabled ? setBlurredSource : noopSetBlurredSource}
                          sourceHighlightIndices={[
                            ...(activeSourceIndex !== null ? [activeSourceIndex] : []),
                            ...activeAlignedSource,
                          ]}
                          targetHighlightIndices={[
                            ...(activeTargetIndex !== null ? [activeTargetIndex] : []),
                            ...activeAlignedTarget,
                          ]}
                          onSourceHover={handleSourceHover}
                          onTargetHover={handleTargetHover}
                          onTargetWordClick={handleTargetWordClick}
                          targetDisabled={popoverOpen}
                          className="text-[20px] leading-[1.5]"
                        />
                      )}
                    </div>
                  </div>

                  {/* -------------------------
                  //* Bottom Utilities Widget
                  //* ------------------------- */}
                  <div className="m-4 pointer-events-auto rounded-2xl border bg-background/95 py-4 shadow-lg backdrop-blur">
                    <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-4">
                      {/* Left: Previous Page */}
                      <div className="flex justify-start items-center pl-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="
                            rounded-sm shadow-md border border-gray-300
                            transition-colors hover:bg-foreground/10 hover:text-foreground
                            "
                          onClick={goPrevPage}
                          aria-label="Previous page"
                          disabled={pageId <= 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* Left spacer: BlurModeToggle */}
                      <div className="flex justify-center">
                        <BlurModeToggle
                          value={blurMode}
                          onChange={setBlurMode}
                          className="border shadow"
                        />
                      </div>
                      {/* Center: Page Tracker */}
                      <div className="flex justify-center">
                        <div className="rounded-full border px-3 py-1 text-sm font-semibold text-muted-foreground">
                          Page {pages.length > 0 ? pageId + 1 : 0} / {pages.length}
                        </div>
                      </div>
                      {/* Right spacer: Help Popover */}
                      <div className="flex justify-left pointer-events-none">
                        <div className="pointer-events-auto">
                          <HelpPopover />
                        </div>
                      </div>
                      {/* Right: Next Page */}
                      <div className="flex justify-end pr-3">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="
                            rounded-sm shadow-md border border-gray-300
                            transition-colors hover:bg-foreground/10 hover:text-foreground
                            "
                          onClick={goNextPage}
                          aria-label="Next page"
                          disabled={pageId >= pages.length - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TextSurface>
              </div>
            </Pane>

            {/* -------------------------
            /* Explain / Define Popover
            /* ------------------------- */}
            <AnchoredPopover
              open={popoverOpen}
              onOpenChange={(open) => {
                setPopoverOpen(open);

                if (!open) {
                  setTargetLocked(false);
                  setLockedTargetIndex(null);
                  setLockedSourceIndices([]);
                  setHoveredTargetIndex(null);
                  setHoveredSourceIndex(null);
                }
              }}
              anchorEl={anchorEl}
              className="w-[min(520px,92vw)]"
            >
              {explanationLoading || !session ? (
                <ExplainSkeleton />
              ) : (
                <div className="p-4 space-y-4">
                  {/* Definition */}
                  {defineData && <DefineCard data={defineData} tgtLang={tgtLang} />}
                  <div className="h-px bg-border" />
                  {/* Explanation / Examples */}
                  {explainData && <ExplainCard data={explainData} />}
                  {/* Sentence Pronunciation */}
                  {defineData && (
                    <div className="
                      inline-flex 
                      rounded-lg border border-border
                      bg-muted/40 
                      px-3 py-2
                    ">
                      <PronounceButton
                        text={defineData.sentence}
                        label="Listen to sentence"
                        tgtLang={tgtLang}
                      />
                    </div>
                  )}
                </div>
              )}
            </AnchoredPopover>
          </div>
        </>
      )}
    </div>
  );
}
