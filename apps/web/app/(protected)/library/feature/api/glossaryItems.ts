import {
  LibraryGlossaryItemsResponse,
  LibraryGlossaryItemsResponseDTO,
  fromLibraryGlossaryItemsResponseDTO
} from "../types/glossaryItem";

/**************************
 * `getRecentGlossaryItems()`
 * -- Fetches recently saved glossary items from user's library
 **************************/
export async function getRecentGlossaryItems(args: {
  limit: number | null;
}): Promise<LibraryGlossaryItemsResponse> {
  const { limit } = args;

  const res = await fetch("/api/glossary_items", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const { glossaryItems } = fromLibraryGlossaryItemsResponseDTO(
    data as LibraryGlossaryItemsResponseDTO
  );

  glossaryItems.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return {
    glossaryItems: limit == null ? glossaryItems : glossaryItems.slice(0, limit),
  };
}