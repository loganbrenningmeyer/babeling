"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import type { LibraryDocument } from "@/app/(protected)/library/feature/types/library";

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
          className="text-xs font-semibold tracking-wider text-muted-foreground"
        >
          RECENT
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
            <button
              key={doc.id}
              type="button"
              onClick={() => onOpenDocument(doc)}
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
                  {doc.src_lang.toUpperCase()}
                </span>

                <span className="text-muted-foreground">→</span>

                {doc.latest_tgt_lang ? (
                  <span
                    className={cn(
                      "rounded border px-2 py-0.5",
                      langBadgeClass("tgt")
                    )}
                  >
                    {doc.latest_tgt_lang.toUpperCase()}
                  </span>
                ) : null}
              </div>

              <div className="line-clamp-1 text-base font-medium text-foreground">
                {doc.title?.trim() || "Untitled"}
              </div>

              <div className="mt-1 text-sm text-muted-foreground">
                {formatRelativeTime(doc.last_opened_at)}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}