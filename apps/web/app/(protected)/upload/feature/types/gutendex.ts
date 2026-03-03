export type GutendexBook = {
  id: number;
  title: string;
  authors: string[];
  languages: string[];
  summaries: string[];
  downloadCount: number;
  epubUrl: string | null;
  coverUrl: string | null;
};

export type GutendexBooksResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  page: number;
  books: GutendexBook[];
};

export type GutendexAuthorDTO = {
  name: string;
}

export type GutendexBookDTO = {
  id: number;
  title: string;
  authors: GutendexAuthorDTO[];
  languages: string[];
  summaries: string[];
  download_count: number;
  formats: Record<string, string | undefined>;
}

export type GutendexBooksResponseDTO = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GutendexBookDTO[];
}