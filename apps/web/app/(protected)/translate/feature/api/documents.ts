import type { LoadedDocument } from "../types";

export async function getDocumentById(
  documentId: number
): Promise<LoadedDocument> {
  // -------------------------
  // Fetch Document information
  // -------------------------
  const params = new URLSearchParams({document_id: String(documentId)})
  const res = await fetch(`/api/documents?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error("Failed to load document");
  }

  return data as LoadedDocument;
}
