import type { GutendexBooksResponse } from "../types/gutendex";

/**************************
 * `searchGutendexBooks()`
 * -- Searches Gutendex given search / languages params & page number
 **************************/
export async function searchGutendexBooks(args: {
  search: string;
  author?: string;
  languages?: string[];
  page?: number;
}): Promise<GutendexBooksResponse> {
  // -------------------------
  // Set Gutendex API URL search params
  // -------------------------
  const params = new URLSearchParams();

  if (args.search.trim()) params.set("search", args.search.trim());
  if (args.author?.trim()) params.set("author", args.author.trim());
  if (args.languages && args.languages.length > 0) {
    params.set("languages", args.languages.join(","));
  }
  if (args.page && args.page > 1) params.set("page", String(args.page));

  const res = await fetch(`/api/gutendex/books?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to search eBooks");
  }

  return data as GutendexBooksResponse;
}
