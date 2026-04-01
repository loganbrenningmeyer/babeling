"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Separator } from "@/components/ui/separator";

import { ReaderShell } from "../feature/components/ReaderShell";
import { TOCSheet } from "../feature/components/Navigation/TOCSheet";

import { BlurMode } from "../feature/types/blur";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useDocumentLoader } from "../feature/hooks/useDocumentLoader";
import { usePageSession } from "../feature/hooks/usePageSession";
import { saveReadProgress } from "../feature/api/readProgress";
import { getCurrentDisplaySection } from "../feature/lib/sections";
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

  const { srcLang: prefSrcLang, tgtLang: prefTgtLang, uiLang: prefUiLang } = useUserPreferences();

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
    if (!document) return null;

    return getCurrentDisplaySection(pageIndex + 1, document.sections)?.title ?? null;
  }, [document, pageIndex]);

  // -------------------------
  // Get document cover image from database
  // -- /api/documents/[documentId]/images/[coverImageId]
  // -------------------------
  const coverImageSrc =
    document?.documentId && document?.coverImageId
      ? `/api/documents/${document.documentId}/images/${document.coverImageId}`
      : null;

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
  // Reader UI toggles
  // -------------------------
  const [blurMode, setBlurMode] = useState<BlurMode>("sentence");
  const [sourceBlurEnabled, setSourceBlurEnabled] = useState(true);
  const [isSwapped, setIsSwapped] = useState(false);

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
    isSwapped,
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

  const blurSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session || !currentPage?.id) return;

    const nextKey = `${currentPage.id}|${tgtLang}|${isSwapped ? "swapped" : "default"}`;
    if (blurSyncKeyRef.current === nextKey) return;

    const sourceWordCount = isSwapped
      ? session.alignment.tgt.words.length
      : session.alignment.src.words.length;

    updateCachedUi((prevUi) => ({
      ...prevUi,
      blurredSource: new Set(Array.from({ length: sourceWordCount }, (_, i) => i)),
      navSentId: -1,
      navParId: -1,
    }));
    blurSyncKeyRef.current = nextKey;
  }, [session, currentPage?.id, tgtLang, isSwapped, updateCachedUi]);

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
        <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,42rem)_minmax(0,1fr)] items-center gap-4">
          {/* -------------------------
          * Left: TOC + Cover Image + Title/Author
          * ------------------------- */}
          <div className="flex min-w-0 items-center">
            <TOCSheet 
              sections={document?.sections ?? []}
              documentTitle={document?.title ?? m.reader.toc.untitledDocument}
              documentAuthor={document?.author}
              srcLang={document?.srcLang ?? "en"}
              tgtLang={tgtLang}
              langLabels={m.langs}
              msgs={m.reader}
              currentPageNumber={pageIndex + 1}
              pageCount={pageCount}
              onSelectSection={(section) => setPage(section.firstPageNumber - 1)}
              onGoToPage={(pageNumber) => setPage(pageNumber - 1)}
            />
            <div className="ml-4 flex min-w-0 items-center gap-3">
              {/* -------------------------
              * Cover Image
              * ------------------------- */}
              {coverImageSrc ? (
                <Image
                  src={coverImageSrc}
                  alt={
                    document?.title
                      ? `${document.title} cover`
                      : "Document cover"
                  }
                  width={36}
                  height={48}
                  unoptimized
                  className="h-12 w-9 shrink-0 rounded-sm border border-border/60 object-cover shadow-sm"
                />
              ) : null}
              {/* -------------------------
              * Title / Author
              * ------------------------- */}
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-reading text-md font-bold leading-tight">
                  {document?.title ?? ""}
                </span>

                {document?.author && (
                  <span className="truncate font-ui text-sm font-thin leading-tight text-muted-foreground">
                    {document.author}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* -------------------------
          * Center: Current Section
          * ------------------------- */}
          <div className="pointer-events-none min-w-0">
            {currentSectionTitle ? (
              <span className="block truncate text-center font-reading text-lg font-semibold text-foreground">
                {currentSectionTitle}
              </span>
            ) : null}
          </div>

          <div aria-hidden="true" />
        </div>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-[90rem] overflow-hidden">
          <ReaderShell
            srcLang={document?.srcLang ?? prefSrcLang ?? "en"}
            tgtLang={tgtLang}
            langLabels={m.langs}
            isSwapped={isSwapped}
            onSwapSides={() => setIsSwapped((prev) => !prev)}
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
