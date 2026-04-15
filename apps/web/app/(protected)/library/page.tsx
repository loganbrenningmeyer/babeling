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
  const { loading: userLoading, error: userError } = useAppUser();

  // -------------------------
  // Recent Documents / Glossary Items Hooks
  // -------------------------
  const {
    documents,
    loading: docsLoading,
    error: docsError,
  } = useRecentDocuments();

  const {
    glossaryItems,
    loading: glossaryLoading,
    error: glossaryError,
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
    return <div className="px-4 sm:px-12">{m.library.error}: {userError ?? docsError ?? glossaryError}</div>;
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        {/* -------------------------
        //* Hero
        //* ------------------------- */}
        <div className="min-w-0">
          <h1 className="font-reading text-3xl font-semibold tracking-tight sm:text-4xl">
            {m.library.hero}
          </h1>
          <p className="font-ui mt-4 text-sm text-muted-foreground">
            {m.library.heroInfo}
          </p>
        </div>

        {/* -------------------------
        //* Reading Stats
        //* ------------------------- */}
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 sm:w-auto sm:gap-8">
          {/* Texts */}
          <div className="flex flex-col items-center sm:items-end">
            <h2 className="font-reading text-xl font-semibold">
              {documents.length}
            </h2>
            <h3 className="font-ui text-xs text-muted-foreground uppercase">
              {m.library.texts}
            </h3>
          </div>

          <div aria-hidden="true" className="h-10 w-[2px] bg-border" />

          {/* Words Saved */}
          <div className="flex flex-col items-center sm:items-end">
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
