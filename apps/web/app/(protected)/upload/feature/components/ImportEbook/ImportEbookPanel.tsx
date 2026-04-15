"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

import { BookText, BookSearch, ChevronLeft, ChevronRight, Loader2, Search, UserRoundPen } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { BookCard } from "./BookCard";

import type { LangLabels } from "@/app/i18n/messages";
import { useGutendexBooks } from "../../hooks/useGutendexBooks";
import { toUiLang } from "@/app/i18n/messages";
import type { GutendexBook } from "../../types/gutendex";

type ImportEbookMsgs = {
  searchBy: string;
  language: string;
  author: string;
  filterByAuthor: string;
  searchGutenberg: string;
  enterTitle: string;
  booksFound: string;
  showing: string;
  prev: string;
  next: string;
};

const LANGUAGE_OPTIONS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "it", label: "IT" },
];

const GUTENDEX_PAGE_SIZE = 32;

export function ImportEbookPanel({
  selectedBookId,
  onSelectBook,
  langLabels,
  msgs,
}: {
  selectedBookId: number | null;
  onSelectBook: (args: {
    bookId: number;
    format: string;
    title: string;
    epubUrl: string | null;
    languages: string[];
  }) => void;
  langLabels: LangLabels;
  msgs: ImportEbookMsgs;
}) {
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  // Draft states before hitting search
  const [searchDraft, setSearchDraft] = useState("");
  const [selectedLanguagesDraft, setSelectedLanguagesDraft] = useState<string[]>([]);
  const [authorDraft, setAuthorDraft] = useState("");

  const { books, loading, error, count, next, previous } = useGutendexBooks({
    search,
    author,
    languages: selectedLanguages,
    page,
  });

  const hasSearched = search.trim().length > 0 || author.trim().length > 0 || selectedLanguages.length > 0;

  const filteredBooks = books.filter((b) => {
    // -------------------------
    // Language filter
    // -------------------------
    const matchesLanguage =
      selectedLanguagesDraft.length === 0 ||
      b.languages?.some((lang) =>
        selectedLanguagesDraft.includes(lang)
      );

    // -------------------------
    // Author filter
    // -------------------------
    const matchesAuthor =
      authorDraft.trim() === "" ||
      b.authors?.some((author) =>
        author
          .toLowerCase()
          .includes(authorDraft.trim().toLowerCase())
      );

    return matchesLanguage && matchesAuthor;
  });

  // -------------------------
  // When language filter selected, set page to 1 and update selectedLanguages
  // -------------------------
  function toggleLanguage(code: string) {
    setPage(1);
    setSelectedLanguagesDraft((current) =>
      current.includes(code)
        ? current.filter((lang) => lang !== code)
        : [...current, code],
    );
  }

  function handleSelectBook(book: GutendexBook) {
    onSelectBook({
      bookId: book.id,
      format: "application/epub+zip",
      title: book.title,
      epubUrl: book.epubUrl,
      languages: book.languages ?? [],
    });
  }

  function handleSubmitSearch() {
    setSearch(searchDraft.trim());
    setAuthor(authorDraft.trim());
    setSelectedLanguages(selectedLanguagesDraft);
    setPage(1);
  }

  const showingStart =
    filteredBooks.length === 0 ? 0 : (page - 1) * GUTENDEX_PAGE_SIZE + 1;
  const showingEnd =
    filteredBooks.length === 0
      ? 0
      : Math.min(count, showingStart + filteredBooks.length - 1);

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmitSearch();
      }}
      className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto bg-muted/20 p-3 sm:gap-6 sm:p-6"
    >
      {/* -------------------------
      * Searching / Filtering
      * ------------------------- */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* -------------------------
        * Search Input / Button
        * ------------------------- */}
        <div className="flex gap-4">
          <div className="relative w-full">
            <div
              className="
                absolute left-4 top-1/2 -translate-y-1/2
                text-muted-foreground
                pointer-events-none
              "
            >
              <BookText className="h-4 w-4" />
            </div>
            <Input
              placeholder={msgs.searchBy}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-12 rounded-full border border-border bg-card pl-10 font-ui text-xs placeholder:text-xs focus-visible:ring-0 sm:text-sm sm:placeholder:text-sm"
            />
            <button
              type="submit"
              className="
                group
                absolute right-2 top-1/2 -translate-y-1/2
                rounded-full bg-foreground p-2
                text-background
                cursor-pointer
                hover:bg-foreground/80
                transition duration-300 ease-out
              "
            >
              <Search
                className="
                  h-5 w-5
                  transition-transform duration-200 ease-out
                  group-hover:rotate-90
                  motion-reduce:transform-none
                "
              />
            </button>
          </div>
        </div>
        {/* -------------------------
        * ( Filtering ): Language / Author
        * ------------------------- */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
          {/* -------------------------
          * Language Filter Buttons
          * ------------------------- */}
          <div className="order-2 flex w-full flex-col gap-1 sm:order-1 sm:w-1/2">
            <div 
              className="
                font-ui uppercase tracking-widest
                text-xs text-foreground/80
              "
            >
              {msgs.language}
            </div>
            {/* Language Buttons Grid */}
            <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <div
                  key={lang["code"]} 
                  className={cn(
                    "inline-flex h-8 min-w-0 items-center justify-center rounded-full border px-1 sm:h-10 sm:px-3",
                    "font-ui text-[10px] font-medium tracking-wide min-[380px]:text-[11px] sm:text-xs",
                    "cursor-pointer select-none transition-colors duration-200 ease-out",
                    "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    selectedLanguagesDraft.includes(lang["code"]) &&
                      "border-primary/30 bg-primary/5 text-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  onClick={() => toggleLanguage(lang["code"])}
                >
                  <span className="min-w-0 truncate">
                    {langLabels[toUiLang(lang["code"])]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* -------------------------
          * Author Search
          * ------------------------- */}
          <div className="order-1 flex w-full flex-col gap-1 sm:order-2 sm:w-1/2">
            <div 
              className="
                font-ui uppercase tracking-widest
                text-xs text-foreground/80
              "
            >
              {msgs.author}
            </div>
            <div className="relative">
              <Input 
                placeholder={msgs.filterByAuthor}
                onChange={(e) => setAuthorDraft(e.target.value)}
                className="h-9 rounded-none border border-border bg-card pl-10 font-ui text-xs placeholder:text-xs focus-visible:ring-0 sm:h-10 sm:text-sm sm:placeholder:text-sm"
              />
              <div
                className="
                  absolute left-4 top-1/2 -translate-y-1/2
                  text-muted-foreground
                  pointer-events-none
                "
              >
                <UserRoundPen className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------
      * Search Results
      * ------------------------- */}
      <Separator />

      <div className="flex-1 min-h-0">
        {!hasSearched ? (
          <div className="flex h-full items-center justify-center sm:-mt-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/10">
                <BookSearch className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="font-ui text-sm font-semibold text-foreground/80">
                {msgs.searchGutenberg}
              </div>

              <div className="font-ui max-w-sm text-sm text-muted-foreground">
                {msgs.enterTitle}
              </div>
            </div>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex h-full items-center justify-center sm:-mt-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="font-ui text-sm tracking-widest uppercase text-foreground/80">
                    <span className="font-bold">{count.toLocaleString()}</span>
                    {" "}{msgs.booksFound}
                    {count > 0 ? (
                      <>
                        {" "}•{" "}{msgs.showing} {showingStart}-{showingEnd}
                      </>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:inline-flex sm:items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!previous || loading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      className="
                        h-8 rounded-full px-3
                        bg-card
                        border-border text-muted-foreground
                        font-ui
                        hover:bg-muted/60 hover:text-foreground
                        disabled:opacity-40
                      "
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {msgs.prev}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!next || loading}
                      onClick={() => setPage((current) => current + 1)}
                      className="
                        h-8 rounded-full px-3
                        bg-card
                        border-border text-muted-foreground
                        font-ui
                        hover:bg-muted/60 hover:text-foreground
                        disabled:opacity-40
                      "
                    >
                      {msgs.next}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {filteredBooks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/70 p-6 text-sm text-muted-foreground">
                    No books match the current filters on this page.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 pb-6 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {filteredBooks.map((book) => (
                      <BookCard 
                        key={book.id}
                        book={book}
                        selected={selectedBookId === book.id}
                        onClick={handleSelectBook}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
        </>
        )}
      </div>
    </form>
  );
}
