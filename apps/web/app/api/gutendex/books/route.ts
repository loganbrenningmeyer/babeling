import { NextRequest, NextResponse } from "next/server";

import type { GutendexBooksResponseDTO } from "@/app/(protected)/upload/feature/types/gutendex";

const GUTENDEX_BOOKS_URL = "https://gutendex.com/books";

// -------------------------
// GET: /api/gutendex/books
// -- Proxies a filtered Gutendex book search for EPUB imports
// -------------------------
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const search = url.searchParams.get("search")?.trim() ?? "";
  const languages = url.searchParams.get("languages")?.trim() ?? "";
  const topic = url.searchParams.get("topic")?.trim() ?? "";
  const pageParam = url.searchParams.get("page")?.trim() ?? "1";

  const page = /^\d+$/.test(pageParam) ? pageParam : "1";

  const upstreamParams = new URLSearchParams();

  if (search) upstreamParams.set("search", search);
  if (languages) upstreamParams.set("languages", languages);
  if (topic) upstreamParams.set("topic", topic);
  upstreamParams.set("page", page);

  // Restrict results to EPUB-capable books for your import flow
  upstreamParams.set("mime_type", "application/epub+zip");

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

  const books = data.results
    .map((book) => {
      const epubUrl = book.formats["application/epub+zip"] ?? null;
      const coverUrl = book.formats["image/jpeg"] ?? null;

      return {
        id: book.id,
        title: book.title,
        authors: book.authors.map((author) => author.name),
        languages: book.languages,
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