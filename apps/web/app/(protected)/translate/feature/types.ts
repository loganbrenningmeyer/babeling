import type { Session } from "@/types/session";

export type SavedPage = {
  id: number;
  page_number: number;
  src_text: string;
};

export type LoadedDocument = {
  document_id: number;
  title: string;
  src_lang: string;
  pages: SavedPage[];
};

export type AlignmentData = {
  src: Session["src"];
  tgt: Session["tgt"];
  align: Session["align"];
}

export type SavedPageTranslation = {
  id: number;
  document_page_id: number;
  src_lang: string;
  tgt_lang: string;
  translated_text: string;
  alignment_data: AlignmentData;
  created_at: string | null;
};
