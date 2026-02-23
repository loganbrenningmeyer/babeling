import type { LoadedDocument, LoadedDocumentDTO } from "../types/document";


/**************************
 * `getDocumentById()`
 * -- GET: /api/documents
 *    Fetches Document from database given the document ID
 **************************/
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

  if (!res.ok) {
    throw new Error("Failed to load document");
  }

  const data = (await res.json()) as LoadedDocumentDTO;

  // -------------------------
  // Sort pages
  // -------------------------
  const pages = (data.pages ?? []).map((p) => ({
    id: p.id,
    pageNumber: p.page_number,
    srcText: p.src_text,
  }));

  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  return {
    documentId: data.document_id,
    title: data.title,
    srcLang: data.src_lang,
    tgtLang: data.tgt_lang,
    pages,
  };
}
