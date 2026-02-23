export type LibraryDocument = {
  id: number;
  title: string;
  src_text: string;
  src_lang: string;
  created_at: string | null;
  latest_tgt_lang: string | null;
};

export type LibraryResponse = {
  documents: LibraryDocument[];
};