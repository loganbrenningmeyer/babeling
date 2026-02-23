// -------------------------
// Frontend return types
// -------------------------
export type SavedPage = {
  id: number;
  pageNumber: number;
  srcText: string;
};

export type LoadedDocument = {
  documentId: number;
  title: string;
  srcLang: string;
  tgtLang: string;
  pages: SavedPage[];
};


// -------------------------
// Backend return types
// -------------------------
export type SavedPageDTO = {
  id: number;
  page_number: number;
  src_text: string;
};

export type LoadedDocumentDTO = {
  document_id: number;
  title: string;
  src_lang: string;
  tgt_lang: string;
  pages: SavedPageDTO[];
};