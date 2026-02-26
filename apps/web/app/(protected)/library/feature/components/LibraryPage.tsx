"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Book, Languages } from "lucide-react";

import { DocumentFlipCard } from "./DocumentCard/DocumentFlipCard";
import { GlossaryItemFlipCard } from "./GlossaryItemCard/GlossaryItemFlipCard";

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
    <div className="space-y-8">
      {/* -------------------------
      * Documents / Translations Card Grid
      * ------------------------- */}
      <div className="space-y-4">
        {/* Documents Header */}
        <div className="flex items-center gap-2">
          <div className="rounded-sm p-1 bg-blue-300/20">
            <Book className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="font-ui text-md font-semibold">Documents</h3>
          <Badge className="font-ui font-bold text-xs bg-muted-foreground/10 text-muted-foreground">
            {documents.length}
          </Badge>
        </div>
        {/* Documents Card Grid */}
        <div className="
          grid gap-6 justify-start 
          [grid-template-columns:repeat(auto-fit,minmax(18rem,22rem))]
        ">
          {documents.map((doc) => (
            <DocumentFlipCard
              key={doc.id}
              document={doc}
            />
          ))}
        </div>
      </div>
      {/* -------------------------
      * Glossary Items
      * ------------------------- */}
      <Separator/>

      <div className="space-y-4">
        {/* Glossary Items Header */}
        <div className="flex items-center gap-2">
          <div className="rounded-sm p-1 bg-orange-300/20">
            <Languages className="h-4 w-4 text-orange-500"/>  
          </div>
          <h3 className="font-ui text-md font-semibold">Saved Words</h3>
          <Badge className="font-ui font-bold bg-muted-foreground/10 text-muted-foreground">
            {glossaryItems.length}
          </Badge>
        </div>
        {/* Glossary Items Card Grid */}
        <div className="
          grid gap-3 justify-start 
          [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]
        ">
          {glossaryItems.map((glossaryItem) => (
            <GlossaryItemFlipCard 
              key={glossaryItem.createdAt}
              glossaryItem={glossaryItem} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}
