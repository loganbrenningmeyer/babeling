"use client";

import Link from "next/link";
import { Clock, MoveRight, Play } from "lucide-react";

import { cn } from "@/lib/utils";

import type { LibraryDocument } from "@/app/(protected)/library/feature/types/document";

import { Button } from "@/components/ui/button";
import { LangBadge } from "@/app/components/LangBadge";
import { Separator } from "@/components/ui/separator";

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
              className="h-40 rounded-2xl border border-foreground/10 bg-muted/80 shadow-sm animate-pulse"
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
                flex h-full flex-col
                rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm
                transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              "
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="line-clamp-2 font-reading text-base font-semibold text-foreground">
                    {doc.title?.trim() || "Untitled"}
                  </div>
                  {doc.author ? (
                    <div className="text-sm font-ui text-muted-foreground">
                      {doc.author}
                    </div>
                  ) : null}
                </div>

                <div className="inline-flex shrink-0 items-center gap-1">
                  <LangBadge lang={doc.srcLang} className="h-6" />
                  <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                  {doc.latestTgtLang ? (
                    <LangBadge lang={doc.latestTgtLang} className="h-6" />
                  ) : null}
                </div>
              </div>


              <div className="mt-auto flex flex-col justify-between gap-4 whitespace-nowrap">
                <Separator />
                <div className="flex items-end">
                  <div className="flex w-full items-center justify-between gap-4">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDocument(doc);
                      }}
                      className="
                          group
                          rounded-full px-6
                          bg-primary/15 text-primary
                          border border-primary/35
                          cursor-pointer
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

                    <div 
                      className="
                        flex items-center gap-1
                        text-xs text-muted-foreground/60
                      "
                    >
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> 
                        {formatRelativeTime(doc.lastOpenedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
