"use client";

import { useState, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Book, Languages, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { DocumentFlipCard } from "./DocumentCard/DocumentFlipCard";
import { GlossaryItemFlipCard } from "./GlossaryItemCard/GlossaryItemFlipCard";
import { FilterItem } from "./FilterItem";

import type { LibraryDocument } from "../types/document";
import type { LibraryGlossaryItem } from "../types/glossaryItem";
import type { LibraryFilterKey } from "./FilterItem";

import { useMessages } from "@/app/hooks/useMessages";


export function LibraryPage({
  documents,
  glossaryItems,
}: {
  documents: LibraryDocument[],
  glossaryItems: LibraryGlossaryItem[],
}) {
  // -------------------------
  // Load UI language / messages info
  // -------------------------
  const m = useMessages();

  {/* Filtering */}
  const [libraryFilter, setLibraryFilter] = useState<LibraryFilterKey>("all");

  {/* Sorting */}
  type DocumentSortKey = "recent" | "srcLang" | "title";
  type GlossarySortKey = "recent" | "language" | "documentTitle" | "word";
  const [documentSort, setDocumentSort] = useState<DocumentSortKey>("recent");
  const [glossarySort, setGlossarySort] = useState<GlossarySortKey>("recent");

  {/* Searching */}
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase();

  {/* -------------------------
  //* Documents sorted by DocumentSortKey
  //* ------------------------- */}
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
        case "title":
          return collator.compare(a.title ?? "", b.title ?? "");
        default:
          return 0;
      }
    });
  }, [documents, documentSort]);

  {/* -------------------------
  //* GlossaryItems sorted by GlossarySortKey
  //* ------------------------- */}
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

  {/* -------------------------
  //* Documents sorted by DocumentSortKey / filtered by query
  //* ------------------------- */}
  const filteredDocuments = useMemo(() => {
    if (!q) return sortedDocuments;

    return sortedDocuments.filter((d) => 
    (d.title ?? "").toLocaleLowerCase().includes(q)
    )
  }, [sortedDocuments, q]);

  {/* -------------------------
  //* GlossaryItems sorted by DocumentSortKey / filtered by query
  //* ------------------------- */}
  const filteredGlossaryItems = useMemo(() => {
    if (!q) return sortedGlossaryItems;

    return sortedGlossaryItems.filter((g) => 
      (g.definition.form ?? "").toLocaleLowerCase().includes(q) ||
      (g.documentTitle ?? "").toLocaleLowerCase().includes(q)
    );
  }, [sortedGlossaryItems, q]);

  return (
    <div className="space-y-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* -------------------------
          //* Search Bar
          //* ------------------------- */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.library.searchLibrary}
              className="pl-9 focus-visible:ring-0 bg-card border border-border"
            />
          </div>
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
            className="grid w-full grid-cols-3 gap-2 bg-transparent p-0 sm:inline-flex sm:w-auto"
            spacing={2}
            >
            <FilterItem value="all" count={documents.length + glossaryItems.length}>
              {m.library.all}
            </FilterItem>
            <FilterItem value="texts" count={documents.length}>
              <Book className="size-3" /> {m.library.texts}
            </FilterItem>
            <FilterItem value="glossary" count={glossaryItems.length}>
              <Star className="size-3" /> {m.library.glossary}
            </FilterItem>
          </ToggleGroup>
        </div>
      </div>

        {/* -------------------------
        * Documents / Translations Card Grid
        * ------------------------- */}
        {(filteredDocuments.length > 0 && (libraryFilter === "all" || libraryFilter === "texts")) && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* -------------------------
              //* Documents Header
              //* ------------------------- */}
              <div className="inline-flex min-w-0 items-center gap-2">
                <div className="rounded-sm p-1 bg-blue-300/20">
                  <Book className="h-4 w-4 text-blue-500" />
                </div>
                <h3 className="font-ui text-md font-semibold">{m.library.texts}</h3>
                <Badge className="font-ui font-bold text-xs bg-muted-foreground/10 text-muted-foreground">
                  {documents.length}
                </Badge>
              </div>
              {/* -------------------------
              * Document Sort Selector
              * ------------------------- */}
              <Select 
                value={documentSort} 
                onValueChange={(v) => setDocumentSort(v as DocumentSortKey)}
              >
                <SelectTrigger className="w-full bg-card sm:w-56">
                  <SelectValue placeholder={m.library.sortDocuments} />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="recent">{m.library.recentlyRead}</SelectItem>
                  <SelectItem value="title">{m.library.titleAZ}</SelectItem>
                  <SelectItem value="srcLang">{m.library.originalLanguageAZ}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* -------------------------
            //* Documents Card Grid
            //* ------------------------- */}
            <div className="
              grid grid-cols-2 gap-3 sm:gap-6
              sm:[grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]
              ">
              {filteredDocuments.map((doc) => (
                <DocumentFlipCard
                  key={doc.id}
                  document={doc}
                  langLabels={m.langs}
                />
              ))}
            </div>
          </div>
        )}
      {/* -------------------------
      * Glossary Items
      * ------------------------- */}
      {(filteredGlossaryItems.length > 0 && (libraryFilter === "all" || libraryFilter === "glossary")) && (
        <>
          {libraryFilter === "all" && <Separator/>}

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* -------------------------
              //* GlossaryItems Header
              //* ------------------------- */}
              <div className="inline-flex min-w-0 items-center gap-2">
                <div className="rounded-sm p-1 bg-orange-300/20">
                  <Languages className="h-4 w-4 text-orange-500"/>  
                </div>
                <h3 className="font-ui text-md font-semibold">{m.library.glossary}</h3>
                <Badge className="font-ui font-bold bg-muted-foreground/10 text-muted-foreground">
                  {glossaryItems.length}
                </Badge>
              </div>
              {/* -------------------------
              //* GlossaryItems Sort Selector
              //* ------------------------- */}
              <Select 
                value={glossarySort} 
                onValueChange={(v) => setGlossarySort(v as GlossarySortKey)}
              >
                <SelectTrigger className="w-full bg-card sm:w-56">
                  <SelectValue placeholder={m.library.sortGlossary} />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="recent">{m.library.recentlyAdded}</SelectItem>
                  <SelectItem value="word">{m.library.wordAZ}</SelectItem>
                  <SelectItem value="language">{m.library.languageAZ}</SelectItem>
                  <SelectItem value="documentTitle">{m.library.documentTitleAZ}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* -------------------------
            //* GlossaryItems Card Grid
            //* ------------------------- */}
            <div className="
              grid grid-cols-2 gap-3
              sm:[grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]
              ">
              {filteredGlossaryItems.map((glossaryItem) => (
                <GlossaryItemFlipCard 
                  key={glossaryItem.createdAt}
                  glossaryItem={glossaryItem} 
                  langLabels={m.langs}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
