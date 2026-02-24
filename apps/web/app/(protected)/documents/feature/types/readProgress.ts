export type SaveReadProgressRequest = {
  documentId: number;
  tgtLang: string;
  currentPageNumber: number; // 1-indexed for backend
};

export type SaveReadProgressResponseDTO = {
  document_id: number;
  tgt_lang: string;
  current_page_number: number;
  completion_percent: number;
  total_pages: number;
  last_read_at: string | null;
  completed_at: string | null;
};
