"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useMessages } from "@/app/hooks/useMessages";

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
  const m = useMessages();

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
              bg-primary-subtle text-primary-subtle-foreground
              border border-primary-border/40
              opacity-100
            `, className
          )}
        >
          <span className="inline-flex items-end gap-[3px] leading-none" aria-hidden="true">
            <span className="dot block size-[4px] rounded-full" />
            <span className="dot block size-[4px] rounded-full" />
            <span className="dot block size-[4px] rounded-full" />
          </span>
          {m.library.loading}
        </Button>
      ) : translation ? (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            openRecentTranslation();
          }} 
          className={cn(`
              group
              rounded-sm px-6 
              bg-primary-subtle text-primary-subtle-foreground
              border border-primary-border/45
              font-ui font-medium
              cursor-pointer
              transition-[transform,border-color,box-shadow] duration-200 ease-out
              hover:border-primary
              hover:shadow-sm
              hover:-translate-y-0.5
              motion-reduce:transform-none
            `, className
          )}
        >
          <div className="flex items-center gap-2 leading-none">
            <Play 
              size={12} 
              className="
                transition-transform duration-300 ease-out
                group-hover:translate-x-0.5
                motion-reduce:transition-none
              "
            />
            <span className="leading-none">{children}</span>
          </div>
        </Button>
      ) : (
        <Button
          disabled
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="rounded-full border border-border bg-muted px-6 text-muted-foreground"
        >
          {m.library.continue}
        </Button>
      )}
    </>
  )
}
