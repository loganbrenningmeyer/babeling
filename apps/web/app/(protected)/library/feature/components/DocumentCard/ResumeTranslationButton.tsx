"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { LangBadge } from "../../../../../components/LangBadge";

import { LibraryDocument } from "../../types/document";
import { LibraryTranslation } from "../../types/translation";


export function ResumeTranslationButton({
  document,
  translation,
  loading,
}: {
  document: LibraryDocument,
  translation: LibraryTranslation | null,
  loading: boolean,
}) {
  // -------------------------
  // API Router Usage
  // -------------------------
  const router = useRouter();

  function openRecentTranslation() {
    if (!translation) return;

    const sp = new URLSearchParams();

    sp.set("page", String(translation.currentPageNumber));
    sp.set("tgt", translation.tgtLang);

    router.push(`/documents/${document.id}?${sp.toString()}`);
  }

  return (
    <>
      {loading ? (
        <Button
          disabled
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="
            rounded-full px-6
            bg-blue-600/10 text-blue-700
            border border-blue-700/60
            opacity-100
        ">
          <span className="inline-flex items-center gap-1.5" aria-hidden="true">
            <span className="dot h-1 w-[3px] rounded-full" />
            <span className="dot h-1 w-[3px] rounded-full" />
            <span className="dot h-1 w-[3px] rounded-full" />
          </span>
          Loading
        </Button>
      ) : translation ? (
        <Button
        onClick={(e) => {
          e.stopPropagation();
          openRecentTranslation();
        }} 
        className="
          group
          rounded-full px-6 
          bg-blue-600/10 text-blue-700 
          border border-blue-700
          transition-[transform, colors] duration-200 ease-out
          hover:bg-blue-600/20
          hover:-translate-y-0.5
          motion-reduce:transform-none
        ">
          <Play 
            size={12} 
            className="
              transition-transform duration-300 ease-out
              group-hover:translate-x-0.5
              motion-reduce:transition-none
            "/>
          Resume <LangBadge lang={translation.tgtLang}/>
        </Button>
      ) : (
        <Button
          disabled
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="rounded-full px-6 opacity-70"
        >
          Continue
        </Button>
      )}
    </>
  )
}