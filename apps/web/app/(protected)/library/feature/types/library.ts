export type LibraryDocument = {
  id: number;
  title: string;
  src_text: string;
  src_lang: string;
  last_opened_at: string | null;
  latest_tgt_lang: string | null;
};

export type LibraryResponse = {
  documents: LibraryDocument[];
};