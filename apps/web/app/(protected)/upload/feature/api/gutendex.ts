import type { GutendexBooksResponse } from "../types/gutendex";

/**************************
 * `searchGutendexBooks()`
 * -- 
 * 
 * @param 
 * @returns 
 **************************/
export async function searchGutendexBooks(args: {
  search: string;
  languages?: string[];
  topic?: string | null;
  page?: number;
}): Promise<GutendexBooksResponse> {
  const params = new URLSearchParams();

  if (args.search.trim()) params.set("search", args.search.trim());
  if (args.languages && args.languages.length > 0) {
    params.set("languages", args.languages.join(","));
  }
  if (args.topic?.trim()) params.set("topic", args.topic.trim());
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
