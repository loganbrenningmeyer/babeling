"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";

// -------------------------
// Translate Session information
// -------------------------
import type { Session } from "@/types/session";

// -------------------------
// API Calls
// -------------------------
import { getDocumentById } from "@/app/(protected)/translate/feature/api/documents";
import { getPageTranslation, savePageTranslation } from "./feature/api/pageTranslations";

// -------------------------
// UI Components
// -------------------------
// Blocks
import { Pane } from "@/app/components/Pane";
import { AppTextarea } from "@/app/components/AppTextarea";
import { TextSurface } from "@/app/components/TextSurface";
import { AnchoredPopover } from "@/app/(protected)/translate/components/AnchoredPopover";
import {
  AnnotateCard,
  type DefineEntry,
  type ExplainEntry,
} from "@/app/(protected)/translate/components/AnnotateCard";
import { SourceBlurButton } from "@/app/(protected)/translate/components/SourceBlur/SourceBlurButton";
import { BlurMode, BlurModeToggle } from "@/app/(protected)/translate/components/SourceBlur/BlurModeToggle";
import { ExplainSkeleton } from "@/app/(protected)/translate/components/ExplainSkeleton";
import { TextSkeleton } from "@/app/(protected)/translate/components/TextSkeleton";
import { ParagraphGrid } from "@/app/(protected)/translate/components/ParagraphGrid";
import { UploadSurface } from "@/app/components/UploadSurface";
import { useSourceRevealNav } from "@/app/(protected)/translate/components/SourceBlur/useSourceRevealNav";

// -------------------------
// Language Info Variables / Functions
// -------------------------
import { SAMPLE_TEXTS_BY_LANG } from "./sampleTexts";
import { LANGS, getLangLabel } from "@/types/langs";
import type {
  LoadedDocument,
  SavedPage,
  SavedPageTranslation,
} from "@/app/(protected)/translate/feature/types";


export default function Translate() {
  // -------------------------
  // Load user information
  // -------------------------
  const { user, loading, error } = useAppUser();

  if (error) return <div className="p-6 text-sm text-red-600">Account error: {error}</div>;

  return (
    <Suspense fallback={<TextSkeleton />}>
      <TranslatePage />
    </Suspense>
  );
}


function TranslatePage() {
  // -------------------------
  // Loading saved Documents
  // -------------------------
  const searchParams = useSearchParams();
  const documentIdParam = searchParams.get("documentId");
  const loadedDocumentIdRef = useRef<number | null>(null);

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
  const pageCache = useRef<Map<number, Session>>(new Map());
  
  // -------------------------
  // Database Information
  // -------------------------
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [pageDbIds, setPageDbIds] = useState<number[]>([]);

  // -------------------------
  // UI state
  // -------------------------
  const [translationLoading, setTranslationLoading] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);
  // Blurred source
  const [blurMode, setBlurMode] = useState<BlurMode>("word");
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(true);
  const emptyBlurredSource = useRef<Set<number>>(new Set());
  const noopSetBlurredSource = (_: Set<number> | ((prev: Set<number>) => Set<number>)) => {};
  // Lock target/source when Popover is showing
  const [lockedTargetIndex, setLockedTargetIndex] = useState<number | null>(null);
  const [lockedSourceIndices, setLockedSourceIndices] = useState<number[]>([]);
  const [targetLocked, setTargetLocked] = useState(false);
  // Current sentence/paragraph for arrow navigation
  const [navSentId, setNavSentId] = useState<number>(-1);
  const [navParId, setNavParId] = useState<number>(-1);
  // Single loading flag for reader loading state
  const readerLoading = documentLoading || translationLoading || !session;

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
  const [isBookmarked, setIsBookmarked] = useState(false);

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

    const text = sourceFile ? await sourceFile.text() : sourceText;

    // Split full text into pages / save to database
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        src_lang: srcLang,
        text: text,
      }),
    });
    const documentData = await res.json();

    // Get saved pages / update database ids if found
    const savedPages: SavedPage[] = documentData.pages ?? [];
    const newPageDbIds = savedPages.map((p) => p.id);
    setDocumentId(documentData.document_id ?? []);
    setPageDbIds(newPageDbIds);

    // Load list of pages source text
    const newPages = savedPages.map((p) => p.src_text);
    setPages(newPages)
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
    await loadPageSession(0, newPages, newPageDbIds, { srcLang, tgtLang });
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
    setTitle(sample.label);

    setSampleLoading(true);
    try {
      const res = await fetch(
        `/texts/${encodeURIComponent(srcLang)}/${encodeURIComponent(sample.filename)}`
      );
      if (!res.ok) throw new Error("Failed to load sample text");
      const text = await res.text();
      setSourceFile(null);
      setSourceText(text);
      setTitle(sample.label);
    } catch (err) {
      console.error(err);
    } finally {
      setSampleLoading(false);
    }
  }

  async function loadPageSession(
    pid: number,
    pagesArg?: string[],
    pageDbIdsArg?: number[],
    langsArg?: { srcLang: string; tgtLang: string }
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
    const srcLangLocal = langsArg?.srcLang ?? srcLang;
    const tgtLangLocal = langsArg?.tgtLang ?? tgtLang;

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

    // -------------------------
    // Load saved translation/alignment for this page and language pair
    // -------------------------
    const pageDbId = pageDbIdsLocal[pid];
    if (pageDbId) {
      const savedPageTranslation = await getPageTranslation({
        documentPageId: pageDbId,
        srcLang: srcLangLocal,
        tgtLang: tgtLangLocal,
      });

      if (savedPageTranslation) {
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
    const sess = await translateAndAlign(pageText, pageDbId, srcLangLocal, tgtLangLocal);
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
    const srcLangLocal = srcLangArg ?? srcLang;
    const tgtLangLocal = tgtLangArg ?? tgtLang;

    // Translate
    const translate_res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: text, src_lang: srcLangLocal, tgt_lang: tgtLangLocal }),
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
        src_lang: srcLangLocal,
        tgt_lang: tgtLangLocal,
      }),
    });
    const align_data = await align_res.json();

    // Update session
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

    // -------------------------
    // Save translated page + alignment data
    // -------------------------
    if (documentPageId) {
      await savePageTranslation({
        documentPageId: documentPageId,
        srcLang: srcLangLocal,
        tgtLang: tgtLangLocal,
        translatedText: target,
        alignmentData: {
          src: sess.src,
          tgt: sess.tgt,
          align: sess.align,
        }
      });
    }

    setTranslationLoading(false);
    return sess;
  }

  async function handleTargetWordClick(i: number, el: HTMLElement) {
    if (!session) return;
    if (targetLocked) return;
    setTargetLocked(true);
    setIsBookmarked(false);

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
  // Sample selection
  // -------------------------
  useEffect(() => {
    setSampleId("");
  }, [srcLang]);

  // =========================================================================
  // BIG CHANGE BLOCK: LOAD SAVED DOCUMENT FROM /translate?documentId=<id>
  // =========================================================================
  // This lets the library route to /translate with a documentId query param.
  // When present, we:
  // 1) fetch the saved document pages from /api/documents/[documentId]
  // 2) hydrate translate page state
  // 3) load the first page into the reader, including saved page translation
  // =========================================================================
  useEffect(() => {
    if (!documentIdParam) return;
    const parsedDocumentId = Number(documentIdParam);
    if (!Number.isFinite(parsedDocumentId)) return;

    if (loadedDocumentIdRef.current === parsedDocumentId) return;

    let cancelled = false;

    const loadSavedDocument = async () => {
      setDocumentLoading(true);

      // Clear immediately so UI shows loading state w/ no defaults
      setShowAligned(true);
      pageCache.current.clear();
      setSession(null);
      setNavSentId(-1);
      setNavParId(-1);
      setExplainData(null);
      setDefineData(null);
      setTargetLocked(false);
      setLockedSourceIndices([]);
      setPopoverOpen(false);

      try {
        const data = await getDocumentById(parsedDocumentId);
        if (cancelled) return;

        const savedPages: SavedPage[] = data.pages ?? [];
        const newPages = savedPages.map((p) => p.src_text);
        const newPageDbIds = savedPages.map((p) => p.id);
        const sourceTextFull = newPages.join("\n\n");

        setDocumentId(data.document_id);
        setTitle(data.title ?? "");
        setSourceText(sourceTextFull);
        setSourceFile(null);
        setSampleId("");
        
        // Load source / target languages
        const loadedSrcLang = data.src_lang;
        const loadedTgtLang = data.tgt_lang;
        setSrcLang(loadedSrcLang);
        setTgtLang(loadedTgtLang);

        setPages(newPages);
        setPageDbIds(newPageDbIds);
        setPageId(0);

        if (newPages.length === 0) {
          setShowAligned(false);
          return;
        }

        await loadPageSession(0, newPages, newPageDbIds, {
          srcLang: loadedSrcLang,
          tgtLang: loadedTgtLang,
        });
        loadedDocumentIdRef.current = parsedDocumentId;
      } catch (err) {
        loadedDocumentIdRef.current = null;
        setShowAligned(false);
        console.error("Failed to load saved document:", err);
      } finally {
        if (!cancelled) {
          setDocumentLoading(false);
        }
      }
    };

    loadSavedDocument();

    return () => {
      cancelled = true;
    };
  }, [documentIdParam]);

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
  return (
    <div className="p-4 font-ui">
      {/* -------------------------
      //* Source Text Input 
      //* ------------------------- */}
      {!showAligned && !translationLoading && !documentLoading ? (
        <Pane className="h-[80vh]">
          {/* -------------------------
          //* Source / Target Selectors
          //* ------------------------- */}
          <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm mb-3">
            <div className="flex items-center gap-4">
              {/* -------------------------
              * Source Language Selector
              * ------------------------- */}
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

              {/* -------------------------
              * Swap Source / Target
              * ------------------------- */}
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

              {/* -------------------------
              * Target Language Selector
              * ------------------------- */}
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

            {/* -------------------------
            * Sample Text
            * ------------------------- */}
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
          {/* Document Title */}
          <div className="shrink-0 rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground">Title:</span>
              <Input
                id="document-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                placeholder="Untitled document"
              />
            </div>
          </div>
          {/* Input Box */}
          <div className="mt-3 flex-1 min-h-0">
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
          <div className="mt-3 shrink-0">
            <UploadSurface 
              className="h-36"
              file={sourceFile}
              onFileChange={async (file) => {
                setSourceFile(file);
                if (!file) return;

                setSampleId("");
                setTitle(file.name.replace(/\.[^/.]+$/, ""));

                if (file.name.toLowerCase().endsWith(".txt")) {
                  const text = await file.text();
                  setSourceText(text);
                }
              }}
            />
          </div>
          
          {/* -------------------------
          //* Translate Button
          //* ------------------------- */}
          <div className="pt-6 shrink-0 flex flex-col items-center gap-2">
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
      ) : (
        <>
          {/* -------------------------
          //* Source / Target HoverText
          //* ------------------------- */}
          <div className="h-[calc(100dvh-4rem-2rem)] flex flex-col overflow-hidden">
            <div className="shrink-0 pb-4 text-center text-[20px] tracking-[0.12em] text-muted-foreground">
              {title}
            </div>
            
            <TextSurface className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden border-b">
                <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-border/70" />

                {/* -------------------------
                //* Source / Target Headers
                //* ------------------------- */}
                <div className="
                  shrink-0 grid grid-cols-2 border-b
                  text-[18px] font-medium
                  leading-none text-foreground/90
                ">
                  <div className="px-8 pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        {readerLoading ? (
                          <span className="inline-block h-6 w-28 animate-pulse rounded bg-muted" />
                        ) : (
                          <div className="inline-flex flex-col">
                            <span>
                              {getLangLabel(srcLang)}
                            </span>
                            <span className="mt-2 h-0.5 w-full bg-blue-300" />
                          </div>
                        )}
                      </div>
                      <SourceBlurButton value={sourceBlurEnabled} onChange={setSourceBlurEnabled} />
                    </div>
                  </div>

                  <div className="pl-12 pt-4 pb-3">
                      <div>
                        {readerLoading ? (
                          <span className="inline-block h-6 w-24 animate-pulse rounded bg-muted" />
                        ) : (
                          <div className="inline-flex flex-col">
                            <span>
                              {getLangLabel(tgtLang)}
                            </span>
                            <span className="mt-2 h-0.5 w-full bg-orange-300" />
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* -------------------------
                //* ParagraphGrid
                //* ------------------------- */}
                <div className="relative flex-1 min-w-0 min-h-0 overflow-y-auto no-scrollbar pb-8">
                  {readerLoading ? (
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
                      className="text-[24px] leading-[1.5]"
                    />
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t px-4 py-3">
                <div className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-3">
                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-md border border-border/60"
                      onClick={goPrevPage}
                      aria-label="Previous page"
                      disabled={pageId <= 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-center">
                    <BlurModeToggle value={blurMode} onChange={setBlurMode} />
                  </div>
                  <div className="flex justify-center text-sm text-muted-foreground">
                    Page {pages.length > 0 ? pageId + 1 : 0} / {pages.length}
                  </div>
                  <div />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-md border border-border/60"
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
                  setIsBookmarked(false);
                }
              }}
              anchorEl={anchorEl}
              className="w-[min(520px,92vw)] overflow-visible"
              >
              {explanationLoading || !session ? (
                <ExplainSkeleton />
              ) : (
                <AnnotateCard
                  defineData={defineData}
                  explainData={explainData}
                  tgtLang={tgtLang}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={() => setIsBookmarked((prev) => !prev)}
                />
              )}
            </AnchoredPopover>
          </div>
        </>
      )}
    </div>
  );
}
