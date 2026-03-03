"use client";

import { useEffect, useRef, useState } from "react";

import type { GutendexBook } from "../types/gutendex";
import { searchGutendexBooks } from "../api/gutendex";


/**************************
 * `useGutendexBooks()`
 * -- Searches Gutendex for Project Gutenberg books with EPUB files
 **************************/
export function useGutendexBooks(args: {
  search: string;
  author?: string;
  languages?: string[];
  page?: number;
  debounceMs?: number;
}) {
  const {
    search,
    author = "",
    languages = [],
    page = 1,
    debounceMs = 400,
  } = args;

  const [books, setBooks] = useState<GutendexBook[]>([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmedSearch = search.trim();
    const trimmedAuthor = author.trim();
    const hasFilters = languages.length > 0 || Boolean(trimmedAuthor);

    // Avoid firing on every empty render unless filters are set
    if (!trimmedSearch && !hasFilters) {
      setBooks([]);
      setCount(0);
      setNext(null);
      setPrevious(null);
      setLoading(false);
      setError(null);
      return;
    }

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    // -------------------------
    // Debounce requests by debounceMs to avoid searching over and over
    // -------------------------
    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await searchGutendexBooks({
          search: trimmedSearch,
          author: trimmedAuthor,
          languages,
          page,
        });

        if (requestIdRef.current !== reqId) return;

        setBooks(res.books);
        setCount(res.count);
        setNext(res.next);
        setPrevious(res.previous);

      } catch (e: any) {
        if (requestIdRef.current !== reqId) return;

        setBooks([]);
        setCount(0);
        setNext(null);
        setPrevious(null);
        setError(e?.message ?? "Failed to search eBooks");

      } finally {
        if (requestIdRef.current === reqId) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search, author, languages, page, debounceMs]);

  return {
    books,
    count,
    next,
    previous,
    loading,
    error,
  };
}
