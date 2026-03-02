"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Separator } from "@/components/ui/separator";

import { ReaderShell } from "../feature/components/ReaderShell";
import { TOCSheet } from "../feature/components/Navigation/TOCSheet";

import { BlurMode } from "../feature/types/blur";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useDocumentLoader } from "../feature/hooks/useDocumentLoader";
import { usePageSession } from "../feature/hooks/usePageSession";
import { saveReadProgress } from "../feature/api/readProgress";
import { capitalizeWords } from "@/lib/string";
import { getLangLabel } from "@/app/i18n/messages";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";
import { useReaderInteraction } from "../feature/hooks/useReaderInteraction";

// Search Params type
type SP = Record<string, string | string[] | undefined>;

export default function ReaderPageClient({
  documentId,
  searchParams,
}: {
  documentId: string;
  searchParams: SP;
}) {
  // -------------------------
  // Setup router / use UI language messages
  // -------------------------
  const router = useRouter();
  const m = useMessages();

  const { tgtLang: prefTgtLang, uiLang: prefUiLang } = useUserPreferences();

  // -------------------------
  // Normalize / default search params (documentId, tgtLang, pageIndex)
  // -------------------------
  const docId = useMemo(() => {
    const n = Number(documentId);
    return Number.isFinite(n) ? n : null;
  }, [documentId]);

  const tgtLang =
    (typeof searchParams.tgt === "string" ? searchParams.tgt : null) ??
    prefTgtLang ??
    "es";

  const requestedPageNumber =
    typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
  
  // -------------------------
  // Load document by ID
  // -------------------------
  const { 
    document, 
    loading: documentLoading, 
    error: documentError 
  } = useDocumentLoader(docId);

  // -------------------------
  // Clamp / default page index if out of bounds
  // -------------------------
  const pageIndex = useMemo(() => {
    if (!document || document.pages.length === 0) return 0;

    // Clamp 1-indexed page number / convert to 0-indexed
    const pageNumber = Number.isFinite(requestedPageNumber) ? Math.floor(requestedPageNumber) : 1;
    const zeroBased = Math.max(1, pageNumber) - 1;

    return Math.max(0, Math.min(zeroBased, document.pages.length - 1));
  }, [document, requestedPageNumber]);

  // -------------------------
  // Get current page / section title from loaded document data
  // -------------------------
  const currentPage = useMemo(() => {
    if (!document) return null;
    return document.pages[pageIndex] ?? null;
  }, [document, pageIndex]);

  const currentSectionTitle = useMemo(() => {
    if (!document || currentPage?.sectionId == null) return null;

    return (
      document.sections.find((section) => section.id === currentPage.sectionId)?.title ?? null
    );
  }, [document, currentPage]);

  // -------------------------
  // Begin ReaderSession for the current document / pageIndex / tgtLang
  // -------------------------
  const {
    session,
    loading: sessLoading,
    error: sessError,
    updateCachedUi,
  } = usePageSession({ document, pageIndex, tgtLang });

  // -------------------------
  // Source / target language labels
  // -------------------------
  const srcLabel = useMemo(() => {
    const src = document?.srcLang ?? "en";
    return getLangLabel(src, m.langs);
  }, [document?.srcLang, m.langs]);

  const tgtLabel = useMemo(() => {
    return getLangLabel(tgtLang, m.langs);
  }, [tgtLang, m.langs]);

  // -------------------------
  // Reader UI toggles
  // -------------------------
  const [blurMode, setBlurMode] = useState<BlurMode>("sentence");
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(true);

  // -------------------------
  // Wire blurredSource to session.ui via updateCachedUi
  // -------------------------
  const blurredSource = session?.ui.blurredSource ?? new Set<number>();

  const setBlurredSource = useCallback(
    (u: Set<number> | ((prev: Set<number>) => Set<number>)) => {
      updateCachedUi((prevUi) => {
        const next =
          typeof u === "function" ? u(prevUi.blurredSource) : u;

        return { ...prevUi, blurredSource: next };
      })
    },
    [updateCachedUi]
  );

  // -------------------------
  // Interaction hook
  // -------------------------
  const uiLang = toUiLang(prefUiLang);

  const interaction = useReaderInteraction({
    session,
    documentId: document?.documentId ?? null,
    pageId: document?.pages?.[pageIndex]?.id ?? null,
    srcLang: document?.srcLang ?? "en",
    tgtLang,
    uiLang,
    sourceBlurEnabled,
    blurredSource,
    setBlurredSource,
    updateCachedUi,
  });

  // -------------------------
  // Page navigation => update URL
  // -------------------------
  const pageCount = document?.pages.length ?? 0;

  const setPage = useCallback(
    (nextIndex: number) => {
      const sp = new URLSearchParams();
      sp.set("page", String(nextIndex + 1));
      sp.set("tgt", tgtLang);
      router.replace(`/documents/${docId}?${sp.toString()}`);
    },
    [router, docId, tgtLang]
  );

  const onPrevPage = useCallback(() => {
    setPage(Math.max(0, pageIndex - 1));
  }, [setPage, pageIndex]);

  const onNextPage = useCallback(() => {
    setPage(Math.min(pageCount - 1, pageIndex + 1));
  }, [setPage, pageCount, pageIndex]);

  // -------------------------
  // Source reveal navigation (arrow keys)
  // -------------------------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (interaction.popoverOpen) return;

      const isArrow = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key);
      if (!isArrow) return;

      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "ArrowLeft") onPrevPage();
        if (e.key === "ArrowRight") onNextPage();
        return;
      }

      if (e.key === "ArrowLeft") interaction.revealPrev("sentence");
      if (e.key === "ArrowRight") interaction.revealNext("sentence");
      if (e.key === "ArrowUp") interaction.revealPrev("paragraph");
      if (e.key === "ArrowDown") interaction.revealNext("paragraph");
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [interaction, onPrevPage, onNextPage]);

  // -------------------------
  // Save read progress for user/document/tgtLang
  // -------------------------
  useEffect(() => {
    if (!document?.documentId) return;
    if (!tgtLang) return;
    if (pageCount <= 0) return;

    const currentPageNumber = pageIndex + 1;  // DB pages are 1-indexed

    const timer = window.setTimeout(() => {
      void saveReadProgress({
        documentId: document.documentId,
        tgtLang,
        currentPageNumber,
      }).catch((err) => {
        console.error("Failed to save read progress", err);
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [document?.documentId, pageIndex, pageCount, tgtLang])

  // -------------------------
  // basic error handling for now
  // -------------------------
  if (documentError) return <div className="p-4 text-sm text-red-600">{documentError}</div>;
  if (sessError) return <div className="p-4 text-sm text-red-600">{sessError}</div>;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="relative h-16 shrink-0 px-4">
        {/* -------------------------
        * Left: TOC + Title / Author
        * ------------------------- */}
        <div className="flex h-full min-w-0 items-center">
          <TOCSheet 
            sections={document?.sections ?? []}
            currentPageNumber={pageIndex + 1}
            onSelectSection={(section) => setPage(section.firstPageNumber - 1)}
          />
          <div className="ml-4 min-w-0">
            <div className="flex flex-col">
              <span className="font-reading text-md font-bold leading-tight">
                {capitalizeWords(document?.title ?? "")}
              </span>

              {document?.author && (
                <span className="font-reading text-sm italic font-thin text-muted-foreground leading-tight">
                  {document.author}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* -------------------------
        * Center: Current Section
        * ------------------------- */}
        {currentSectionTitle && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-20">
            <span className="font-reading truncate text-lg text-muted-foreground">
              {currentSectionTitle}
            </span>
          </div>
        )}
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-[90rem] overflow-hidden">
          <ReaderShell
            tgtLang={tgtLang}
            srcLabel={srcLabel}
            tgtLabel={tgtLabel}
            documentId={document?.documentId ?? null}
            currentPage={currentPage}
            documentImages={document?.images ?? []}
            session={session}
            loading={documentLoading || sessLoading}
            pageIndex={pageIndex}
            pageCount={pageCount}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            blurMode={blurMode}
            onBlurModeChange={setBlurMode}
            sourceBlurEnabled={sourceBlurEnabled}
            onSourceBlurEnabledChange={setSourceBlurEnabled}
            interaction={{
              blurredSource,
              setBlurredSource,
              ...interaction,
            }}
            msgs={m.reader}
          />
        </div>
      </div>
    </div>
  );
}
