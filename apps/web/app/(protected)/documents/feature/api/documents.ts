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
  const params = new URLSearchParams({ document_id: String(documentId) });
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
  // -- Preserve saved page blocks so the reader can interleave text + images
  // -------------------------
  const pages = (data.pages ?? []).map((p) => ({
    id: p.id,
    pageNumber: p.page_number,
    srcText: p.src_text,
    sectionId: p.section_id ?? null,
    sectionPageIndex: p.section_page_index ?? null,
    blocks: (p.blocks ?? []).map((block) => ({
      id: block.id,
      blockIndex: block.block_index,
      blockType: block.block_type,
      tag: block.tag ?? null,
      text: block.text ?? null,
      documentImageId: block.document_image_id ?? null,
      alt: block.alt ?? null,
    })),
  }));

  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  // -------------------------
  // Preserve sections for current-page section title lookup
  // -------------------------
  const sections = (data.sections ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    depth: s.depth,
    parentSectionId: s.parent_section_id,
    orderIndex: s.order_index,
    firstPageNumber: s.first_page_number,
    lastPageNumber: s.last_page_number,
  }));

  return {
    documentId: data.document_id,
    title: data.title,
    author: data.author,
    sourceKind: data.source_kind,
    coverImageId: data.cover_image_id ?? null,
    srcLang: data.src_lang,
    tgtLang: data.tgt_lang ?? null,
    pages,
    sections,
    // -------------------------
    // Preserve image metadata so page blocks can validate image references
    // -------------------------
    images: (data.images ?? []).map((image) => ({
      id: image.id,
      mediaType: image.media_type ?? null,
      byteLength: image.byte_length,
    })),
  };
}
