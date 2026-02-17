"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";
import type { LibraryDocument } from "@/types/library";
import { LANGS } from "@/types/langs";
import { setPendingTranslateInput } from "@/lib/translateInputBridge";

// -------------------------
// UI Components
// -------------------------
import { Pane } from "@/app/components/Pane";
import { LibrarySkeleton } from "@/app/(protected)/library/components/LibrarySkeleton";
import { LibraryDataTable } from "@/app/(protected)/library/components/LibraryDataTable";

export default function LibraryTable() {
  // -------------------------
  // Load user information
  // -------------------------
  const { user, loading: userLoading, error: userError } = useAppUser();
  const router = useRouter();

  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // Load user library
  // -------------------------
  const loadUserLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/library", {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error ?? "Failed to load library");
      setDocs(data.documents ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  function getDefaultTargetLang(srcLang: string) {
    return LANGS.find((lang) => lang.code !== srcLang)?.code ?? "fr";
  }

  async function openDocument(doc: LibraryDocument) {
    if (!doc.src_text.trim()) return;

    const tgtLang = doc.latest_tgt_lang ?? getDefaultTargetLang(doc.src_lang);

    let pages: string[] | undefined = undefined;
    let pageDbIds: number[] | undefined = undefined;

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: doc.title,
          src_lang: doc.src_lang,
          tgt_lang: tgtLang,
          text: doc.src_text,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const savedPages = Array.isArray(data.pages) ? data.pages : [];
        pages = savedPages.map((p: { src_text: string }) => p.src_text);
        pageDbIds = savedPages.map((p: { id: number }) => p.id);
      }
    } catch (err) {
      console.error("Failed to load saved pages", err);
    }

    setPendingTranslateInput({
      sourceText: doc.src_text,
      title: doc.title,
      srcLang: doc.src_lang,
      tgtLang,
      pages,
      pageDbIds,
    });
    router.push("/translate");
  }

  // -------------------------
  // Refresh user library on new user
  // -------------------------
  useEffect(() => {
    if (!user) return;
    loadUserLibrary();
  }, [user, loadUserLibrary]);

  // -------------------------
  // Library Loading Skeleton
  // -------------------------
  if (userLoading || loading) {
    return (
      <div className="w-full">
        <Pane
          title="Library"
          className="min-h-[80vh]"
          contentClassName="gap-4"
        >
          <LibrarySkeleton />
        </Pane>
      </div>
    );
  }

  if (userError || error) {
    return <div className="px-12">Error: {userError ?? error}</div>;
  }

  return (
    <div className="p-4">
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-8 text-sm text-muted-foreground">
          No documents yet. Start a reading session to save your first
          document.
        </div>
      ) : (
        <LibraryDataTable docs={docs} onOpenDocument={openDocument} />
      )}
    </div>
  );
}
