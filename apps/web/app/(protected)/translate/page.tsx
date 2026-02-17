"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";

// -------------------------
// Translate Session information
// -------------------------
import type { Session } from "@/types/session";

// -------------------------
// UI Components
// -------------------------
import { TextSurface } from "@/app/components/TextSurface";
import { AnchoredPopover } from "@/app/(protected)/translate/components/AnchoredPopover";
import { SourceBlurButton } from "@/app/(protected)/translate/components/SourceBlur/SourceBlurButton";
import { BlurMode, BlurModeToggle } from "@/app/(protected)/translate/components/SourceBlur/BlurModeToggle";
import { DefineEntry, DefineCard } from "@/app/(protected)/translate/components/DefineCard";
import { ExplainEntry, ExplainCard } from "@/app/(protected)/translate/components/ExplainCard";
import { ExplainSkeleton } from "@/app/(protected)/translate/components/ExplainSkeleton";
import { TextSkeleton } from "@/app/(protected)/translate/components/TextSkeleton";
import { ParagraphGrid } from "@/app/(protected)/translate/components/ParagraphGrid";
import { HelpPopover } from "@/app/(protected)/translate/components/HelpInfo/HelpPopover";
import { useSourceRevealNav } from "@/app/(protected)/translate/components/SourceBlur/useSourceRevealNav";
import { PronounceButton } from "@/app/(protected)/translate/components/Pronounce/PronounceButton";

import { getLangLabel } from "@/types/langs";
import {
  takePendingTranslateInput,
  type TranslateInputPayload,
} from "@/lib/translateInputBridge";


export default function Translate() {
  // -------------------------
  // Load user information
  // -------------------------
  const { error } = useAppUser();

  if (error) return <div className="p-6 text-sm text-red-600">Account error: {error}</div>;

  return <TranslatePage />;
}


function TranslatePage() {
  const router = useRouter();

  // -------------------------
  // Core state
  // -------------------------
  const [sourceText, setSourceText] = useState("");
  const [title, setTitle] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("fr");
  const [explainData, setExplainData] = useState<ExplainEntry | null>(null);
  const [defineData, setDefineData] = useState<DefineEntry | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  // Cache translated / aligned pages
  const [pages, setPages] = useState<string[]>([]);
  const [pageId, setPageId] = useState<number>(0);
  const [pageDbIds, setPageDbIds] = useState<number[]>([]);
  const pageCache = useRef<Map<number, Session>>(new Map());
  const inputBootstrapped = useRef(false);

  type SavedPageTranslation = {
    id: number;
    document_page_id: number;
    src_lang: string;
    tgt_lang: string;
    translated_text: string;
    alignment_data: {
      src: Session["src"];
      tgt: Session["tgt"];
      align: Session["align"];
    };
    created_at: string | null;
  };

  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);
  // Blurred source
  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(false);
  const emptyBlurredSource = useMemo<Set<number>>(() => new Set(), []);
  const noopSetBlurredSource: (next: Set<number> | ((prev: Set<number>) => Set<number>)) => void = () => {};
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
  // Derived values
  // -------------------------
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

  // -------------------------
  // Handlers
  // -------------------------
  async function startReadingSession(args?: Partial<TranslateInputPayload>) {
    const source = args?.sourceText ?? sourceText;
    const sourceLang = args?.srcLang ?? srcLang;
    const targetLang = args?.tgtLang ?? tgtLang;
    const documentTitle = args?.title ?? title;
    if (!source.trim()) return;

    setTitle(documentTitle);
    setSourceText(source);
    setSrcLang(sourceLang);
    setTgtLang(targetLang);

    const incomingPages = args?.pages;
    const incomingPageDbIds = args?.pageDbIds;
    const hasSavedPages =
      Array.isArray(incomingPages) &&
      incomingPages.length > 0 &&
      Array.isArray(incomingPageDbIds) &&
      incomingPageDbIds.length === incomingPages.length;

    let newPages: string[] = [];
    let newPageDbIds: number[] = [];

    if (hasSavedPages) {
      newPages = incomingPages ?? [];
      newPageDbIds = incomingPageDbIds ?? [];
    } else {
      const splitRes = await fetch("/api/split_pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: documentTitle,
          src_lang: sourceLang,
          tgt_lang: targetLang,
          text: source,
        }),
      });
      const splitData = await splitRes.json();
      const splitPages = Array.isArray(splitData.pages) ? splitData.pages : [];
      newPages = splitPages.length > 0 ? splitPages : [source];
    }

    setPages(newPages);
    setPageDbIds(newPageDbIds);
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
    await loadPageSession(0, newPages, newPageDbIds, sourceLang, targetLang);
  }

  async function loadPageSession(
    pid: number,
    pagesArg?: string[],
    pageDbIdsArg?: number[],
    srcLangArg?: string,
    tgtLangArg?: string
  ) {
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
    const pageDbIdsLocal = pageDbIdsArg ?? pageDbIds;
    const sourceLang = srcLangArg ?? srcLang;
    const targetLang = tgtLangArg ?? tgtLang;

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

    const pageDbId = pageDbIdsLocal[pid];
    if (pageDbId) {
      const savedRes = await fetch("/api/page_translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_page_id: pageDbId,
          src_lang: sourceLang,
          tgt_lang: targetLang,
        }),
      });
      const savedData = await savedRes.json();
      const savedPageTranslation: SavedPageTranslation | null =
        savedData.page_translation ?? null;

      if (savedRes.ok && savedPageTranslation) {
        const sess: Session = {
          sourceText: pageText,
          targetText: savedPageTranslation.translated_text,
          src: savedPageTranslation.alignment_data.src,
          tgt: savedPageTranslation.alignment_data.tgt,
          align: savedPageTranslation.alignment_data.align,
          state: {
            blurredSource: new Set(
              savedPageTranslation.alignment_data.src.words.map((_, i) => i)
            ),
            navSentId: -1,
            navParId: -1,
          },
        };

        pageCache.current.set(pid, sess);
        setSession(sess);
        setBlurredSource(new Set(sess.src.words.map((_, i) => i)));
        setShowAligned(true);
        return;
      }
    }
    
    // Cache page's session
    const sess = await translateAndAlign(pageText, pageDbId, sourceLang, targetLang);
    if (sess) {
      pageCache.current.set(pid, sess);
      setSession(sess);
      setBlurredSource(new Set(sess.src.words.map((_, i) => i)));
      setShowAligned(true);
    }

  }

  async function translateAndAlign(
    text: string,
    documentPageId?: number,
    srcLangArg?: string,
    tgtLangArg?: string
  ) {
    if (!text.trim()) return;

    setTranslationLoading(true);
    const sourceLang = srcLangArg ?? srcLang;
    const targetLang = tgtLangArg ?? tgtLang;

    try {
      const translate_res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: text,
          src_lang: sourceLang,
          tgt_lang: targetLang,
        }),
      });
      const translate_data = await translate_res.json();

      const source = translate_data.source;
      const target = translate_data.target;

      const align_res = await fetch("/api/align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          target,
          src_lang: sourceLang,
          tgt_lang: targetLang,
        }),
      });
      const align_data = await align_res.json();

      const sess: Session = {
        sourceText: source,
        targetText: target,
        src: {
          words: align_data.src.words,
          spaces: align_data.src.spaces,
          sentIds: align_data.src.sentIds,
          parIds: align_data.src.parIds,
          sentToParIds: align_data.src.sentToParIds,
          sentToWordIds: align_data.src.sentToWordIds,
          parToSentIds: align_data.src.parToSentIds,
          parToWordIds: align_data.src.parToWordIds,
        },
        tgt: {
          words: align_data.tgt.words,
          spaces: align_data.tgt.spaces,
          sentIds: align_data.tgt.sentIds,
          parIds: align_data.tgt.parIds,
          sentToParIds: align_data.tgt.sentToParIds,
          sentToWordIds: align_data.tgt.sentToWordIds,
          parToSentIds: align_data.tgt.parToSentIds,
          parToWordIds: align_data.tgt.parToWordIds,
        },
        align: {
          srcToTgt: align_data.align.srcToTgt,
          tgtToSrc: align_data.align.tgtToSrc,
        },
        state: {
          blurredSource: new Set(align_data.src.words.map((_: string, i: number) => i)),
          navSentId: -1,
          navParId: -1,
        }
      };

      if (documentPageId) {
        await fetch("/api/page_translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_page_id: documentPageId,
            src_lang: sourceLang,
            tgt_lang: targetLang,
            translated_text: target,
            alignment_data: {
              src: sess.src,
              tgt: sess.tgt,
              align: sess.align,
            },
          }),
        });
      }

      return sess;
    } finally {
      setTranslationLoading(false);
    }
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

    const res = await fetch("/api/annotate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        srcLang: srcLang,
        tgtLang: tgtLang,
        src: {
          words: session.src.words,
          spaces: session.src.spaces,
          sentIds: session.src.sentIds,
          parIds: session.src.parIds,
        },
        tgt: {
          words: session.tgt.words,
          spaces: session.tgt.spaces,
          sentIds: session.tgt.sentIds,
          parIds: session.tgt.parIds,
        },
        tgtToSrc: session.align.tgtToSrc,
        tgtIdx: i,
      }),
    });
    const data = await res.json();

    setExplainData({
      explanation: data.usage.explanation,
      examples: data.usage.examples,
    });
    setDefineData({
      form: data.definition.form,
      posForm: data.definition.posForm,
      ipaForm: data.definition.ipaForm,

      lemma: data.definition.lemma,
      posLemma: data.definition.posLemma,
      ipaLemma: data.definition.ipaLemma,

      gloss: data.definition.gloss,

      srcSent: data.definition.srcSent,
      srcPar: data.definition.srcPar,
      tgtSent: data.definition.tgtSent,
      tgtPar: data.definition.tgtPar,
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
  // Input handoff from upload page
  // -------------------------
  useEffect(() => {
    if (inputBootstrapped.current) return;
    inputBootstrapped.current = true;

    const pending = takePendingTranslateInput();
    if (!pending || !pending.sourceText.trim()) {
      router.replace("/upload");
      return;
    }

    void startReadingSession({
      sourceText: pending.sourceText,
      title: pending.title,
      srcLang: pending.srcLang,
      tgtLang: pending.tgtLang,
      pages: pending.pages,
      pageDbIds: pending.pageDbIds,
    }).catch((err) => {
      console.error("Failed to start translation session", err);
      router.replace("/upload");
    });
  }, [router, startReadingSession]);

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
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [
    showAligned,
    popoverOpen,
    prev,
    next,
    goPrevPage,
    goNextPage,
  ]);


  // -------------------------
  // Render
  // -------------------------
  return (
    <div className="p-4">
      <>
          {/* -------------------------
          //* Source / Target HoverText
          //* ------------------------- */}
          <div>
            <div className="flex-1 min-h-0">
              {/* -------------------------
              //* --------- [Title] ----------
              //* [Source Text] | [Target Text]
              //* ------------------------- */}
              <TextSurface className="relative h-full flex flex-col overflow-hidden pt-0">
                {/* Title Header */}
                <div className="
                    flex w-full justify-center
                    pt-6 pb-5
                    border-b 
                    font-reading font-normal
                    uppercase tracking-[0.12em] leading-none
                    text-[22px] text-muted-foreground 
                ">
                  {title}
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
                        blurredSource={sourceBlurEnabled ? blurredSource : emptyBlurredSource}
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
                <div className="p-4 space-y-4 font-ui">
                  {/* Definition */}
                  {defineData && <DefineCard data={defineData} tgtLang={tgtLang} />}
                  <div className="h-px bg-border" />
                  {/* Explanation / Examples */}
                  {explainData && <ExplainCard data={explainData} />}
                  <div className="h-px w-full bg-border" />
                  {/* Sentence / Paragraph Pronunciation */}
                  {defineData && (
                    <div className="flex w-full justify-between gap-2">
                      {/* Sentence */}
                      <PronounceButton
                        text={defineData.tgtSent}
                        label="Listen to sentence"
                        tgtLang={tgtLang}
                        iconClassName="h-4 w-4"
                      />
                      {/* Paragraph */}
                      <PronounceButton
                        text={defineData.tgtPar}
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
      </>
    </div>
  );
}
