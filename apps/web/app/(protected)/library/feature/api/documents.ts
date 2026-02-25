import {
  LibraryDocumentResponse,
  LibraryDocumentResponseDTO,
  fromLibraryDocumentResponseDTO,
} from "../types/document";

/**************************
 * `getRecentDocuments()`
 * -- Fetches recent documents / latest tgtLangs from user's library
 **************************/
export async function getRecentDocuments(args: {
  limit: number | null;
}): Promise<LibraryDocumentResponse> {
  const { limit } = args;

  const res = await fetch("/api/library/documents", {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load recent documents");
  }

  const { documents } = fromLibraryDocumentResponseDTO(
    data as LibraryDocumentResponseDTO
  );

  documents.sort((a, b) => {
    const ta = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
    const tb = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
    return tb - ta;
  });

  return {
    documents: limit == null ? documents : documents.slice(0, limit),
  };
}


