import type { LibraryDocument, LibraryResponse } from "../types/library";

/**************************
 * `getRecentDocuments()`
 * -- Fetches recent documents / latest tgtLangs from user's library 
 **************************/
export async function getRecentDocuments(args: {
  limit: number;
}): Promise<LibraryResponse> {
  const { limit } = args;

  const res = await fetch("/api/library", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const docs = (data.documents ?? []) as LibraryDocument[];

  docs.sort((a, b) => {
    const ta = a.last_opened_at ? new Date(a.last_opened_at).getTime() : 0;
    const tb = b.last_opened_at ? new Date(b.last_opened_at).getTime() : 0;
    return tb - ta;
  });

  return { documents: docs.slice(0, limit) };
}