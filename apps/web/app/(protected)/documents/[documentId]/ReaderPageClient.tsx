"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useDocumentLoader } from "../feature/hooks/useDocumentLoader";
import { usePageSession } from "../feature/hooks/usePageSession";

import { BlurMode } from "../../translate/types/blur";

import { ReaderShell } from "../feature/components/ReaderShell";
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

  const requestedPage =
    typeof searchParams.page === "string" ? Number(searchParams.page) : 0;
  
  // -------------------------
  // Load document by ID
  // -------------------------
  const { 
    document, 
    loading: documentLoading, 
    error: documentError 
  } = useDocumentLoader(docId);

  const srcLang = document?.srcLang ?? prefSrcLang ?? "en";
  
  // -------------------------
  // Clamp / default page index if out of bounds
  // -------------------------
  const pageIndex = useMemo(() => {
    if (!document || document.pages.length === 0) return 0;
    const p = Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 0;
    return Math.max(0, Math.min(p, document.pages.length - 1));
  }, [document, requestedPage]);

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
      sp.set("page", String(nextIndex));
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

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true } as any);
  }, [interaction, onPrevPage, onNextPage]);

  // -------------------------
  // basic error handling for now
  // -------------------------
  if (documentError) return <div className="p-4 text-sm text-red-600">{documentError}</div>;
  if (sessError) return <div className="p-4 text-sm text-red-600">{sessError}</div>;

  return (
    <div className="p-4 font-ui">
      <ReaderShell
        title={document?.title ?? ""}
        srcLang={srcLang}
        tgtLang={tgtLang}
        srcLabel={srcLabel}
        tgtLabel={tgtLabel}
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
  );
}