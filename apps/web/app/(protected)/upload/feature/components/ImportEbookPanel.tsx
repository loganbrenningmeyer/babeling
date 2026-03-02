"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useGutendexBooks } from "../hooks/useGutendexBooks";

const LANGUAGE_OPTIONS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
];

export function ImportEbookPanel({
  selectedBookId,
  onSelectBook,
}: {
  selectedBookId?: number | null;
  onSelectBook?: (args: { bookId: number; format: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [topic, setTopic] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { books, loading, error, count, next, previous } = useGutendexBooks({
    search,
    languages: selectedLanguages,
    topic,
    page,
  });

  function toggleLanguage(code: string) {
    setPage(1);
    setSelectedLanguages((current) =>
      current.includes(code)
        ? current.filter((lang) => lang !== code)
        : [...current, code],
    );
  }

  function handleSelectBook(bookId: number) {
    onSelectBook?.({
      bookId,
      format: "application/epub+zip",
    });
  }

  return (
    <div className="flex h-full flex-1 flex-col p-4 font-ui">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <Input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search Project Gutenberg titles or authors"
          className="bg-background"
        />
        <Input
          value={topic ?? ""}
          onChange={(e) => {
            setPage(1);
            const value = e.target.value.trim();
            setTopic(value ? value : null);
          }}
          placeholder="Optional topic filter"
          className="bg-background"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {LANGUAGE_OPTIONS.map((lang) => {
          const active = selectedLanguages.includes(lang.code);

          return (
            <Button
              key={lang.code}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 rounded-full px-3",
                active && "border-foreground bg-foreground text-background",
              )}
              onClick={() => toggleLanguage(lang.code)}
            >
              {lang.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading
            ? "Searching Gutendex..."
            : count > 0
              ? `${count.toLocaleString()} matches`
              : "Search for an EPUB to import"}
        </span>
        <span>Page {page}</span>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-border/60 bg-muted/20">
        {error ? (
          <div className="p-4 text-sm text-destructive">{error}</div>
        ) : books.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            {loading
              ? "Loading results..."
              : "No books yet. Start typing above to query Gutendex."}
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {books.map((book) => {
              const isSelected = selectedBookId === book.id;

              return (
                <div
                  key={book.id}
                  className={cn(
                    "flex items-start justify-between gap-4 p-4",
                    isSelected && "bg-foreground/5",
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {book.title}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {book.authors.length > 0
                        ? book.authors.join(", ")
                        : "Unknown author"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {book.languages.join(", ").toUpperCase()} ·{" "}
                      {book.downloadCount.toLocaleString()} downloads
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectBook(book.id)}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || !previous || page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || !next}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
