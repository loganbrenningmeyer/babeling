"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ArrowUpDown, Clock, Languages, Calendar, Type } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LibraryDocument } from "../types/library";
import { LANG_BADGE_COLOR_BY_CODE } from "@/types/langs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useMessages } from "@/app/hooks/useMessages";
import { getLangLabel } from "@/app/i18n/messages";

// -------------------------
// Library Sorting
// -------------------------
type SortKey = "title" | "src_lang" | "created_at";
type SortDir = "asc" | "desc";

const SORT_LABELS = [
  { key: "title", label: "Title" },
  { key: "src_lang", label: "Original Language" },
  { key: "created_at", label: "Date Created" },
] as const;

function getSortLabel(key: string) {
  return SORT_LABELS.find((l) => l.key === key)?.label ?? key;
}

// -------------------------
// Format created_at date to Month Day, Year
// -------------------------
function formatDate(value: string | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// -------------------------
// Get short preview of source text
// -------------------------
function getPreview(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) return "No preview available.";
  return compact.length > 120 ? `${compact.slice(0, 120)}...` : compact;
}

// -------------------------
// Minimal SVG radial progress (0..100)
// -------------------------
function RadialProgress({
  value,
  label,
  size = 34,
  stroke = 3,
  className,
}: {
  value: number; // 0..100
  label?: string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-label={label ?? `${Math.round(v)}% complete`}
      role="img"
    >
      <svg width={size} height={size} className="block">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.20)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      <span className="absolute text-[10px] font-medium text-muted-foreground">
        {Math.round(v)}%
      </span>
    </div>
  );
}

function getDocProgressPct(doc: LibraryDocument): number | null {
  // If your LibraryDocument already has a progress percent, it will be used.
  // Supported (optional) field names:
  // - progress_pct (0..100)
  // - progressPercent (0..100)
  // Otherwise return null (no ring shown).
  const anyDoc = doc as unknown as {
    progress_pct?: number;
    progressPercent?: number;
  };

  const v =
    typeof anyDoc.progress_pct === "number"
      ? anyDoc.progress_pct
      : typeof anyDoc.progressPercent === "number"
        ? anyDoc.progressPercent
        : null;

  if (v === null) return null;
  if (!Number.isFinite(v)) return null;
  return Math.min(100, Math.max(0, v));
}

function DocumentCard({
  doc,
  m,
  onOpen,
}: {
  doc: LibraryDocument;
  m: ReturnType<typeof useMessages>;
  onOpen: (doc: LibraryDocument) => void;
}) {
  const srcColorClass =
    LANG_BADGE_COLOR_BY_CODE[doc.src_lang] ?? "bg-muted text-muted-foreground";

  const tgtColorClass = doc.latest_tgt_lang
    ? LANG_BADGE_COLOR_BY_CODE[doc.latest_tgt_lang] ??
      "bg-muted text-muted-foreground"
    : "bg-muted/60 text-muted-foreground";

  const progressPct = getDocProgressPct(doc);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(doc)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(doc);
        }
      }}
      className={cn(
        "group cursor-pointer overflow-hidden",
        "transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("font-semibold", srcColorClass)}>
              {getLangLabel(doc.src_lang, m.langs)}
            </Badge>
            <span className="text-xs text-muted-foreground">→</span>
            <Badge className={cn("font-semibold", tgtColorClass)}>
              {doc.latest_tgt_lang
                ? getLangLabel(doc.latest_tgt_lang, m.langs)
                : "No translation yet"}
            </Badge>
          </div>

          {typeof progressPct === "number" ? (
            <RadialProgress
              value={progressPct}
              label={`${Math.round(progressPct)}% complete`}
            />
          ) : null}
        </div>

        <div className="space-y-1">
          <CardTitle className="text-base leading-snug line-clamp-1">
            {doc.title}
          </CardTitle>
          <CardDescription className="text-xs">
            {formatDate(doc.created_at)}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {getPreview(doc.src_text)}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          Open
        </span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100">
          →
        </span>
      </CardFooter>
    </Card>
  );
}

export function LibraryPage({ docs }: { docs: LibraryDocument[] }) {
  // -------------------------
  // Use UI language messages from user preferences
  // -------------------------
  const m = useMessages();

  // -------------------------
  // API Router Usage
  // -------------------------
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupByLanguage, setGroupByLanguage] = useState(false);

  // -------------------------
  // Open saved Document on click
  // -------------------------
  function openDocument(doc: LibraryDocument) {
    const sp = new URLSearchParams();
    sp.set("page", "0");

    if (doc.latest_tgt_lang) {
      sp.set("tgt", doc.latest_tgt_lang);
    }

    router.push(`/documents/${doc.id}?${sp.toString()}`);
  }

  // -------------------------
  // Toggle sorting direction
  // -------------------------
  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDir(nextKey === "created_at" ? "desc" : "asc");
  }

  // -------------------------
  // Filter + Sort Documents by title, contents, or language
  // -------------------------
  const filteredAndSortedDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = docs.filter((doc) => {
      if (!needle) return true;

      return (
        doc.title.toLowerCase().includes(needle) ||
        doc.src_text.toLowerCase().includes(needle) ||
        getLangLabel(doc.src_lang, m.langs).toLowerCase().includes(needle)
      );
    });

    filtered.sort((a, b) => {
      if (sortKey === "created_at") {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDir === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aValue =
        sortKey === "title" ? a.title : getLangLabel(a.src_lang, m.langs);
      const bValue =
        sortKey === "title" ? b.title : getLangLabel(b.src_lang, m.langs);

      const result = aValue.localeCompare(bValue);
      return sortDir === "asc" ? result : -result;
    });

    return filtered;
  }, [docs, query, sortDir, sortKey, m.langs]);

  // -------------------------
  // Group Documents by Language
  // -------------------------
  const groupedDocs = useMemo(() => {
    if (!groupByLanguage) return [];

    const groups = new Map<string, LibraryDocument[]>();

    for (const doc of filteredAndSortedDocs) {
      const key = doc.src_lang;
      const group = groups.get(key) ?? [];
      group.push(doc);
      groups.set(key, group);
    }

    return Array.from(groups.entries());
  }, [filteredAndSortedDocs, groupByLanguage]);

  const sortLabel = `${getSortLabel(sortKey)} (${sortDir})`;

  return (
    <div className="space-y-4 font-ui">
      {/* -------------------------
       * Controls
       * ------------------------- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter by title, contents, or language..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Library options
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort</DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={sortKey === "created_at"}
              onCheckedChange={() => toggleSort("created_at")}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Created
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={sortKey === "title"}
              onCheckedChange={() => toggleSort("title")}
            >
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Title
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={sortKey === "src_lang"}
              onCheckedChange={() => toggleSort("src_lang")}
            >
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Language
              </div>
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Display</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={groupByLanguage}
              onCheckedChange={(checked) => setGroupByLanguage(!!checked)}
            >
              Group by language
            </DropdownMenuCheckboxItem>

            <DropdownMenuSeparator />

            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Sorted by{" "}
              <span className="font-medium text-foreground">{sortLabel}</span>
            </div>

            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                Toggle direction
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-xs text-muted-foreground">
        {filteredAndSortedDocs.length} Documents • Sorted by {sortLabel}
      </div>

      <Separator />

      {/* -------------------------
       * Card Grid
       * ------------------------- */}
      {filteredAndSortedDocs.length === 0 ? (
        <div className="rounded-md border p-10 text-center text-muted-foreground">
          No documents found.
        </div>
      ) : groupByLanguage ? (
        <div className="space-y-8">
          {groupedDocs.map(([srcLang, rows]) => (
            <Fragment key={srcLang}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {getLangLabel(srcLang, m.langs)}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({rows.length})
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    m={m}
                    onOpen={openDocument}
                  />
                ))}
              </div>
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedDocs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} m={m} onOpen={openDocument} />
          ))}
        </div>
      )}
    </div>
  );
}