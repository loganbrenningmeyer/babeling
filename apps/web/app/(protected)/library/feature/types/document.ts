export type LibraryDocument = {
  id: number;
  title: string;
  author: string | null;
  srcText: string;
  srcLang: string;
  totalPages: number;
  coverImageId: number | null;
  lastOpenedAt: string | null;
  latestTgtLang: string | null;
};

export type LibraryDocumentResponse = {
  documents: LibraryDocument[];
};

export type LibraryDocumentDTO = {
  id: number;
  title: string;
  author: string | null;
  src_text: string;
  src_lang: string;
  total_pages: number;
  cover_image_id: number | null;
  last_opened_at: string | null;
  latest_tgt_lang: string | null;
};

export type LibraryDocumentResponseDTO = {
  documents: LibraryDocumentDTO[];
};

export function fromLibraryDocumentDTO(
  dto: LibraryDocumentDTO
): LibraryDocument {
  return {
    id: dto.id,
    title: dto.title,
    author: dto.author,
    srcText: dto.src_text,
    srcLang: dto.src_lang,
    totalPages: dto.total_pages,
    coverImageId: dto.cover_image_id ?? null,
    lastOpenedAt: dto.last_opened_at,
    latestTgtLang: dto.latest_tgt_lang,
  };
}

export function fromLibraryDocumentResponseDTO(
  dto: LibraryDocumentResponseDTO
): LibraryDocumentResponse {
  return {
    documents: dto.documents.map(fromLibraryDocumentDTO),
  };
}
