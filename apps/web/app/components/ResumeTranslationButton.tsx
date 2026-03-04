"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { LangBadge } from "./LangBadge";

import { LibraryDocument } from "../(protected)/library/feature/types/document";
import { LibraryTranslation } from "../(protected)/library/feature/types/translation";


export function ResumeTranslationButton({
  document,
  translation,
  loading,
  children,
  className,
}: {
  document: LibraryDocument,
  translation: LibraryTranslation | null,
  loading: boolean,
  children: React.ReactNode,
  className?: string,
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
          className={cn(`            
              rounded-full px-6
              bg-blue-600/10 text-blue-700
              border border-blue-600/35
              dark:bg-blue-500/10 dark:text-blue-300
              dark:border-blue-400/25
              opacity-100
            `, className
          )}
        >
          <span className="inline-flex items-end gap-[3px] leading-none" aria-hidden="true">
            <span className="dot block size-[4px] rounded-full" />
            <span className="dot block size-[4px] rounded-full" />
            <span className="dot block size-[4px] rounded-full" />
          </span>
          Loading
        </Button>
      ) : translation ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            openRecentTranslation();
          }} 
          className={cn(`
              group
              rounded-full px-6 
              bg-blue-600/10 text-blue-700 
              border border-blue-600/35
              dark:bg-blue-500/10 dark:text-blue-300
              dark:border-blue-400/25
              cursor-pointer
              transition-[transform, colors] duration-200 ease-out
              hover:bg-blue-600/20
              hover:-translate-y-0.5
              motion-reduce:transform-none
            `, className
          )}
        >
          <Play 
            size={12} 
            className="
              transition-transform duration-300 ease-out
              group-hover:translate-x-0.5
              motion-reduce:transition-none
            "
          />
          <span className="inline-flex items-center gap-2">
            {children}
          </span>
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