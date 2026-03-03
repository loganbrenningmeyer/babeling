import { NextRequest, NextResponse } from "next/server";

import type { GutendexBooksResponseDTO } from "@/app/(protected)/upload/feature/types/gutendex";

const GUTENDEX_BOOKS_URL = "https://gutendex.com/books";

// -------------------------
// GET: /api/gutendex/books
// -- Proxies a filtered Gutendex book search for EPUB imports
// -------------------------
export async function GET(req: NextRequest) {
  // -------------------------
  // Parse URL search params
  // -------------------------
  const url = new URL(req.url);

  const search = url.searchParams.get("search")?.trim() ?? "";
  const author = url.searchParams.get("author")?.trim() ?? "";
  const languages = url.searchParams.get("languages")?.trim() ?? "";
  const pageParam = url.searchParams.get("page")?.trim() ?? "1";

  const page = /^\d+$/.test(pageParam) ? pageParam : "1";

  // -------------------------
  // Set Gutendex API URL search params
  // -------------------------
  const upstreamParams = new URLSearchParams();
  const upstreamSearch = [search, author].filter(Boolean).join(" ");

  if (upstreamSearch) upstreamParams.set("search", upstreamSearch);
  if (languages) upstreamParams.set("languages", languages);
  upstreamParams.set("page", page);

  // Restrict results to EPUB-capable books for your import flow
  upstreamParams.set("mime_type", "application/epub+zip");

  // -------------------------
  // Fetch gutendex.com/books?{upstreamParams}
  // -------------------------
  try {
    const res = await fetch(`${GUTENDEX_BOOKS_URL}?${upstreamParams.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const text = await res.text();
    let data: GutendexBooksResponseDTO | null = null;

    try {
      data = text ? (JSON.parse(text) as GutendexBooksResponseDTO) : null;
    } catch {
      data = null;
    }

    if (!res.ok || !data) {
      return NextResponse.json(
        { error: "Failed to query Gutendex" },
        { status: 502 },
      );
    }

  // -------------------------
  // Get book info for each result
  // -------------------------
  const books = data.results
    .map((book) => {
      const epubUrl = book.formats["application/epub+zip"] ?? null;
      const coverUrl = book.formats["image/jpeg"] ?? null;

      return {
        id: book.id,
        title: book.title,
        authors: book.authors.map((author) => author.name),
        languages: book.languages,
        summaries: book.summaries,
        downloadCount: book.download_count,
        epubUrl,
        coverUrl,
      };
    })
    .filter((book) => Boolean(book.epubUrl));

    return NextResponse.json(
      {
        count: data.count,
        next: data.next,
        previous: data.previous,
        page: Number(page),
        books,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach Gutendex" },
      { status: 502 },
    );
  }
}
