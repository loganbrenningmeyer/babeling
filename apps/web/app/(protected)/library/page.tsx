"use client";

import { useAppUser } from "@/components/AppUserProvider";
import { useRecentDocuments } from "./feature/hooks/useRecentDocuments";
import { useRecentGlossaryItems } from "./feature/hooks/useRecentGlossaryItems";

import { LibrarySkeleton } from "@/app/(protected)/library/feature/components/LibrarySkeleton";
import { LibraryPage } from "@/app/(protected)/library/feature/components/LibraryPage";
import { ContinueReadingCard } from "./feature/components/ContinueReadingCard";
import { useMessages } from "@/app/hooks/useMessages";


export default function Library() {
  const m = useMessages();

  // -------------------------
  // Load user information
  // -------------------------
  const { user, loading: userLoading, error: userError } = useAppUser();

  // -------------------------
  // Recent Documents / Glossary Items Hooks
  // -------------------------
  const {
    documents,
    loading: docsLoading,
    error: docsError,
    reload: reloadDocs,
  } = useRecentDocuments();

  const {
    glossaryItems,
    loading: glossaryLoading,
    error: glossaryError,
    reload: reloadGlossary,
  } = useRecentGlossaryItems();

  // -------------------------
  // Library Loading Skeleton
  // -------------------------
  if (userLoading || docsLoading || glossaryLoading) {
    return (
      <div className="p-4">
        <LibrarySkeleton />
      </div>
    );
  }

  if (userError || docsError || glossaryError) {
    return <div className="px-12">{m.library.error}: {userError ?? docsError ?? glossaryError}</div>;
  }

  return (
    <div className="min-h-screen mx-auto max-w-6xl py-12 px-8">
      <div className="flex items-end justify-between">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <div>
          <h1 className="font-reading font-semibold text-4xl tracking-tight">
            {m.library.hero}
          </h1>
          <p className="font-ui mt-4 text-sm text-muted-foreground">
            {m.library.heroInfo}
          </p>
        </div>

        {/* -------------------------
        //* Reading Stats
        //* ------------------------- */}
        <div className="flex items-center gap-8">
          {/* Texts */}
          <div className="flex flex-col items-end">
            <h2 className="font-reading text-xl font-semibold">
              {documents.length}
            </h2>
            <h3 className="font-ui text-xs text-muted-foreground uppercase">
              {m.library.texts}
            </h3>
          </div>

          <div aria-hidden="true" className="h-10 w-[2px] bg-border" />

          {/* Words Saved */}
          <div className="flex flex-col items-end">
            <h2 className="font-reading text-xl font-semibold">
              {glossaryItems.length}
            </h2>
            <h3 className="font-ui text-xs text-muted-foreground uppercase">
              {m.library.wordsSaved}
            </h3>
          </div>
        </div>
      </div>

      {/* -------------------------
      //* Continue Reading
      //* ------------------------- */}
      {documents[0] && <ContinueReadingCard document={documents[0]} />}

      {/* -------------------------
      * Library Page
      * ------------------------- */}
      <div className="font-ui mt-6">
        {documents.length === 0 ? (
          <div className="
            rounded-xl 
            border border-dashed bg-muted/40 p-8 
            font-ui text-sm text-muted-foreground
          ">
            {m.library.noDocuments}
          </div>
        ) : (
          <LibraryPage 
            documents={documents}
            glossaryItems={glossaryItems}
          />
        )}
      </div>
    </div>
  );
}
