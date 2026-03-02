"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { ResumeTranslationButton } from "@/app/(protected)/library/feature/components/DocumentCard/ResumeTranslationButton";

import type { LibraryDocument } from "@/app/(protected)/library/feature/types/document";

import { capitalizeWords } from "@/lib/string";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

type RecentDocumentsPanelProps = {
  documents: LibraryDocument[];
  loading: boolean;
  error: string | null;
  onOpenDocument: (doc: LibraryDocument) => void;
  className?: string;
};


function formatRelativeTime(iso: string | null) {
  if (!iso) return "";

  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = then - now; // negative if in past

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (Math.abs(diffMs) < hour) {
    return rtf.format(Math.round(diffMs / minute), "minute");
  }
  if (Math.abs(diffMs) < day) {
    return rtf.format(Math.round(diffMs / hour), "hour");
  }
  if (Math.abs(diffMs) < week) {
    return rtf.format(Math.round(diffMs / day), "day");
  }
  return rtf.format(Math.round(diffMs / week), "week");
}


function langBadgeClass(kind: "src" | "tgt") {
  return kind === "src"
    ? "bg-blue-50 text-blue-700 border-blue-100"
    : "bg-orange-50 text-orange-700 border-orange-100";
}


export function RecentDocumentsPanel({
  documents,
  loading,
  error,
  onOpenDocument,
  className,
}: RecentDocumentsPanelProps) {
  return (
    <section className={cn("w-full", className)} aria-labelledby="recent-docs-title">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="recent-docs-title"
          className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
        >
          Recently read
        </h2>

        <Link
          href="/library"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          View library →
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-foreground/10 bg-background/70 shadow-sm animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
          No recent documents yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="
                rounded-2xl border border-foreground/10 bg-background px-4 py-3 text-left shadow-sm
                transition-colors hover:bg-muted/20
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              "
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5",
                    langBadgeClass("src")
                  )}
                >
                  {doc.srcLang.toUpperCase()}
                </span>

                <span className="text-muted-foreground">→</span>

                {doc.latestTgtLang ? (
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5",
                      langBadgeClass("tgt")
                    )}
                  >
                    {doc.latestTgtLang.toUpperCase()}
                  </span>
                ) : null}
              </div>

              <div className="mb-3 line-clamp-1 font-reading text-base font-semibold text-foreground">
                {capitalizeWords(doc.title?.trim()) || "Untitled"}
              </div>

              <div className="w-fit flex flex-col items-center gap-1">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDocument(doc);
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
                    "
                  >
                  <Play 
                    size={12}
                    className="
                        transition-transform duration-300 ease-out
                        group-hover:translate-x-0.5
                        motion-reduce:transition-none
                      "
                    />
                  Resume reading
                </Button>

                <p className="text-xs text-muted-foreground/60 text-center italic">
                  Read {formatRelativeTime(doc.lastOpenedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}