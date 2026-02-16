"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LibraryDocument } from "@/types/library";
import { getLangLabel, LANG_BADGE_COLOR_BY_CODE } from "@/types/langs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


// -------------------------
// Library Sorting
// -------------------------
type SortKey = "title" | "src_lang" | "created_at";
type SortDir = "asc" | "desc";

const SORT_LABELS = [
  { key: "title", label: "Title" },
  { key: "src_lang", label: "Language" },
  { key: "created_at", label: "Date Created" },
];

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


export function LibraryDataTable({ docs }: { docs: LibraryDocument[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupByLanguage, setGroupByLanguage] = useState(false);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDir(nextKey === "created_at" ? "desc" : "asc");
  }

  // -------------------------
  // Filter Documents by title, contents, or language
  // -------------------------
  const filteredAndSortedDocs = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const filtered = docs.filter((doc) => {
      if (!needle) return true;

      return (
        doc.title.toLowerCase().includes(needle) ||
        doc.src_text.toLowerCase().includes(needle) ||
        getLangLabel(doc.src_lang).toLowerCase().includes(needle)
      );
    });

    filtered.sort((a, b) => {
      if (sortKey === "created_at") {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortDir === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aValue = sortKey === "title" ? a.title : getLangLabel(a.src_lang);
      const bValue = sortKey === "title" ? b.title : getLangLabel(b.src_lang);
      const result = aValue.localeCompare(bValue);

      return sortDir === "asc" ? result : -result;
    });

    return filtered;
  }, [docs, query, sortDir, sortKey]);

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

  // Displayed sorting by label
  const sortLabel = `${getSortLabel(sortKey)} (${sortDir})`;

  function renderDataRow(doc: LibraryDocument) {
    const langColorClass =
      LANG_BADGE_COLOR_BY_CODE[doc.src_lang] ?? "bg-muted text-muted-foreground";

    return (
      <TableRow key={doc.id}>
        <TableCell className="max-w-[16rem] whitespace-normal font-medium">
          {doc.title}
        </TableCell>
        <TableCell>
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold",
              langColorClass
            )}
          >
            {getLangLabel(doc.src_lang)}
          </span>
        </TableCell>
        <TableCell>{formatDate(doc.created_at)}</TableCell>
        <TableCell className="max-w-[24rem] whitespace-normal text-muted-foreground">
          {getPreview(doc.src_text)}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-4">
      {/* -------------------------
      //* Table Controls
      //* ------------------------- */}
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
              Table options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sort</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={sortKey === "created_at"}
              onCheckedChange={() => toggleSort("created_at")}
            >
              Date Created
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortKey === "title"}
              onCheckedChange={() => toggleSort("title")}
            >
              Title
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sortKey === "src_lang"}
              onCheckedChange={() => toggleSort("src_lang")}
            >
              Language
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Display</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={groupByLanguage}
              onCheckedChange={(checked) => setGroupByLanguage(!!checked)}
            >
              Group by language
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-xs text-muted-foreground">
        {filteredAndSortedDocs.length} Documents • Sorted by {sortLabel}
      </div>

      {/* -------------------------
      //* Data Table
      //* ------------------------- */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("title")}
                >
                  Title
                  <ArrowUpDown className="size-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("src_lang")}
                >
                  Language
                  <ArrowUpDown className="size-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  className="-ml-3 h-8"
                  onClick={() => toggleSort("created_at")}
                >
                  Date Created
                  <ArrowUpDown className="size-4" />
                </Button>
              </TableHead>
              <TableHead>Preview</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredAndSortedDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : groupByLanguage ? (
              groupedDocs.map(([srcLang, rows]) => (
                <Fragment key={srcLang}>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold">
                      {getLangLabel(srcLang)} ({rows.length})
                    </TableCell>
                  </TableRow>
                  {rows.map((doc) => renderDataRow(doc))}
                </Fragment>
              ))
            ) : (
              filteredAndSortedDocs.map((doc) => renderDataRow(doc))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
