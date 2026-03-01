// -------------------------
// Frontend return types
// -------------------------
export type SavedPage = {
  id: number;
  pageNumber: number;
  srcText: string;
  sectionId: number | null;
};

export type LoadedSection = {
  id: number;
  title: string;
  depth: number;
  parentSectionId: number | null;
  orderIndex: number;
  firstPageNumber: number;
  lastPageNumber: number;
};

export type LoadedDocument = {
  documentId: number;
  title: string;
  author: string | null;
  srcLang: string;
  tgtLang: string | null;
  pages: SavedPage[];
  sections: LoadedSection[];
};


// -------------------------
// Backend return types
// -------------------------
export type SavedPageDTO = {
  id: number;
  page_number: number;
  src_text: string;
  section_id: number | null;
};

export type LoadedSectionDTO = {
  id: number;
  title: string;
  depth: number;
  parent_section_id: number | null;
  order_index: number;
  first_page_number: number;
  last_page_number: number;
};

export type LoadedDocumentDTO = {
  document_id: number;
  title: string;
  author: string | null;
  src_lang: string;
  tgt_lang: string | null;
  pages: SavedPageDTO[];
  sections: LoadedSectionDTO[];
};
