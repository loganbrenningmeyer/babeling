// -------------------------
// Frontend return types
// -------------------------
export type SavedPage = {
  id: number;
  pageNumber: number;
  srcText: string;
  sectionId: number | null;
  sectionPageIndex: number | null;
  blocks: SavedPageBlock[];
};

export type SavedPageBlock = {
  id: number;
  blockIndex: number;
  blockType: "text" | "image";
  tag: string | null;
  text: string | null;
  documentImageId: number | null;
  alt: string | null;
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

export type LoadedDocumentImage = {
  id: number;
  mediaType: string | null;
  byteLength: number;
};

export type LoadedDocument = {
  documentId: number;
  title: string;
  author: string | null;
  sourceKind: string;
  srcLang: string;
  tgtLang: string | null;
  pages: SavedPage[];
  sections: LoadedSection[];
  images: LoadedDocumentImage[];
};


// -------------------------
// Backend return types
// -------------------------
export type SavedPageDTO = {
  id: number;
  page_number: number;
  src_text: string;
  section_id: number | null;
  section_page_index: number | null;
  blocks: SavedPageBlockDTO[];
};

export type SavedPageBlockDTO = {
  id: number;
  block_index: number;
  block_type: "text" | "image";
  tag: string | null;
  text: string | null;
  document_image_id: number | null;
  alt: string | null;
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

export type LoadedDocumentImageDTO = {
  id: number;
  media_type: string | null;
  byte_length: number;
};

export type LoadedDocumentDTO = {
  document_id: number;
  title: string;
  author: string | null;
  source_kind: string;
  src_lang: string;
  tgt_lang: string | null;
  pages: SavedPageDTO[];
  sections: LoadedSectionDTO[];
  images: LoadedDocumentImageDTO[];
};
