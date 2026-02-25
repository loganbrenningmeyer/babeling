import {
  LibraryDocumentResponse,
  LibraryDocumentDTO,
  fromLibraryDocumentDTO,
  LibraryGlossaryItemResponse,
  LibraryGlossaryItem,
  LibraryGlossaryItemDTO,
  fromLibraryGlossaryItemDTO,
} from "../types/library";

/**************************
 * `getRecentDocuments()`
 * -- Fetches recent documents / latest tgtLangs from user's library
 **************************/
export async function getRecentDocuments(args: {
  limit: number;
}): Promise<LibraryDocumentResponse> {
  const { limit } = args;

  const res = await fetch("/api/library", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const docsDTO = (data.documents ?? []) as LibraryDocumentDTO[];
  const docs = docsDTO.map(fromLibraryDocumentDTO);

  docs.sort((a, b) => {
    const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
    const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
    return tb - ta;
  });

  return { documents: docs.slice(0, limit) };
}

/**************************
 * `getRecentGlossaryItems()`
 * -- Fetches recently saved glossary items from user's library
 **************************/
export async function getRecentGlossaryItems(args: {
  limit: number;
}): Promise<LibraryGlossaryItemResponse> {
  const { limit } = args;

  const res = await fetch("/api/glossary_items", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const glossItemsDTO = (data.glossary_items ??
    []) as LibraryGlossaryItemDTO[];
  const glossItems = glossItemsDTO.map(fromLibraryGlossaryItemDTO);

  glossItems.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return { glossaryItems: glossItems.slice(0, limit) };
}
