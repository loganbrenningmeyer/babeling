"use client";

import { useCallback, useEffect, useState } from "react";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";
import { useRecentDocuments } from "./feature/hooks/useRecentDocuments";
import { useRecentGlossaryItems } from "./feature/hooks/useRecentGlossaryItems";

// -------------------------
// UI Components
// -------------------------
import { LibrarySkeleton } from "@/app/(protected)/library/feature/components/LibrarySkeleton";
import { LibraryPage } from "@/app/(protected)/library/feature/components/LibraryPage";


export default function Library() {
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
    return <div className="px-12">Error: {userError ?? docsError ?? glossaryError}</div>;
  }

  return (
    <div className="min-h-screen px-8 w-full">
      {/* -------------------------
      * Hero
      * ------------------------- */}
      <div className="pt-12">
        <h1 className="font-reading text-4xl tracking-tight">
          Your library
        </h1>
        <p className="font-ui mt-4 text-sm text-muted-foreground">
          Texts, translations, and vocabulary you've collected.
        </p>
      </div>
      {/* -------------------------
      * Library Page
      * ------------------------- */}
      <div className="font-ui mt-10">
        {documents.length === 0 ? (
          <div className="
            rounded-xl 
            border border-dashed bg-muted/40 p-8 
            font-ui text-sm text-muted-foreground
          ">
            No documents yet. Start a reading session to save your first
            document.
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
