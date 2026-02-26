"use client";

import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Book, Languages, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DocumentFlipCard } from "./DocumentCard/DocumentFlipCard";
import { GlossaryItemFlipCard } from "./GlossaryItemCard/GlossaryItemFlipCard";
import { FilterItem } from "./FilterItem";

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
  {/* Filtering */}
  type LibraryFilterKey = "all" | "texts" | "glossary";
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilterKey>("all");

  {/* Sorting */}
  type DocumentSortKey = "recent" | "srcLang" | "tgtLang" | "title";
  type GlossarySortKey = "recent" | "language" | "documentTitle" | "word";
  const [documentSort, setDocumentSort] = useState<DocumentSortKey>("recent");
  const [glossarySort, setGlossarySort] = useState<GlossarySortKey>("recent");

  const sortedDocuments = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });

    return [...documents].sort((a, b) => {
      switch (documentSort) {
        case "recent": {
          const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
          const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
          return bTime - aTime;
        }
        case "srcLang":
          return collator.compare(a.srcLang ?? "", b.srcLang ?? "");
        case "tgtLang":
          return collator.compare(a.latestTgtLang ?? "", b.latestTgtLang ?? "");
        case "title":
          return collator.compare(a.title ?? "", b.title ?? "");
        default:
          return 0;
      }
    });
  }, [documents, documentSort]);

  const sortedGlossaryItems = useMemo(() => {
    const collator = new Intl.Collator(undefined, { sensitivity: "base" });

    return [...glossaryItems].sort((a, b) => {
      switch (glossarySort) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "language":
          return collator.compare(a.tgtLang ?? "", b.tgtLang ?? "");
        case "documentTitle":
          return collator.compare(a.documentTitle ?? "", b.documentTitle ?? "");
        case "word":
          return collator.compare(a.definition.form ?? "", b.definition.form ?? "");
        default:
          return 0;
      }
    });
  }, [glossaryItems, glossarySort]);

  return (
    <div className="space-y-8">
      <div className="flex flex-row gap-3 justify-between items-center">
        {/* -------------------------
        * Library Filter
        * ------------------------- */}
        <ToggleGroup
          type="single"
          value={libraryFilter}
          onValueChange={(v) => {
            if (!v) return;
            setLibraryFilter(v as LibraryFilterKey);
          }}
          className="inline-flex bg-transparent p-0"
          spacing={2}
        >
          <FilterItem value="all" count={documents.length + glossaryItems.length}>
            All
          </FilterItem>
          <FilterItem value="texts" count={documents.length}>
            <Book className="size-3" /> Texts
          </FilterItem>
          <FilterItem value="glossary" count={glossaryItems.length}>
            <Star className="size-3" /> Glossary
          </FilterItem>
        </ToggleGroup>

        {/* -------------------------
        * Sort Selection
        * ------------------------- */}
        <Select 
          value={documentSort} 
          onValueChange={(v) => setDocumentSort(v as DocumentSortKey)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort documents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently read</SelectItem>
            <SelectItem value="srcLang">Original language</SelectItem>
            <SelectItem value="tgtLang">Translated language</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

        {/* -------------------------
        * Documents / Translations Card Grid
        * ------------------------- */}
        {(libraryFilter === "all" || libraryFilter === "texts") && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {/* Documents Header */}
              <div className="rounded-sm p-1 bg-blue-300/20">
                <Book className="h-4 w-4 text-blue-500" />
              </div>
              <h3 className="font-ui text-md font-semibold">Texts</h3>
              <Badge className="font-ui font-bold text-xs bg-muted-foreground/10 text-muted-foreground">
                {documents.length}
              </Badge>
            </div>
            {/* Documents Card Grid */}
            <div className="
              grid gap-6 justify-start 
              [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]
              ">
              {sortedDocuments.map((doc) => (
                <DocumentFlipCard
                key={doc.id}
                document={doc}
                />
              ))}
            </div>
          </div>
        )}
      {/* -------------------------
      * Glossary Items
      * ------------------------- */}
      {(libraryFilter === "all" || libraryFilter === "glossary") && (
        <>
          {libraryFilter === "all" && <Separator/>}

          <div className="space-y-4">
            {/* Glossary Items Header */}
            <div className="flex items-center gap-2">
              <div className="rounded-sm p-1 bg-orange-300/20">
                <Languages className="h-4 w-4 text-orange-500"/>  
              </div>
              <h3 className="font-ui text-md font-semibold">Glossary</h3>
              <Badge className="font-ui font-bold bg-muted-foreground/10 text-muted-foreground">
                {glossaryItems.length}
              </Badge>
            </div>
            {/* Glossary Items Card Grid */}
            <div className="
              grid gap-3 justify-start 
              [grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr))]
              ">
              {glossaryItems.map((glossaryItem) => (
                <GlossaryItemFlipCard 
                key={glossaryItem.createdAt}
                glossaryItem={glossaryItem} 
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
