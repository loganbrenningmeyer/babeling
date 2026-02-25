"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { FlipCard } from "./DocumentFlipCard/FlipCard";

import type { LibraryDocument } from "../types/document";
import type { LibraryGlossaryItem } from "../types/glossaryItem";

import { useMessages } from "@/app/hooks/useMessages";
import { getLangLabel } from "@/app/i18n/messages";


export function LibraryPage({
  documents,
  glossaryItems,
}: {
  documents: LibraryDocument[],
  glossaryItems: LibraryGlossaryItem[],
}) {


  return (
    <div className="grid gap-6 justify-start [grid-template-columns:repeat(auto-fit,20rem)]">
      {/* -------------------------
      * Documents / Translations Card Grid
      * ------------------------- */}
      {documents.map((doc) => (
        <FlipCard
          key={doc.id}
          document={doc}
        />
      ))}
      {/* -------------------------
      * Glossary Items
      * ------------------------- */}

    </div>
  )
}