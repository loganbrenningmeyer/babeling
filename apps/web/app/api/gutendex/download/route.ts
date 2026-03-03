import { NextRequest, NextResponse } from "next/server";

// -------------------------
// POST: /api/gutendex/download
// -- Proxies an EPUB download so the browser does not hit the external URL directly
// -------------------------
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const epubUrlRaw =
    body && typeof body === "object" && "epub_url" in body
      ? String((body as { epub_url: unknown }).epub_url ?? "").trim()
      : "";

  if (!epubUrlRaw) {
    return NextResponse.json(
      { error: "Missing epub_url" },
      { status: 400 },
    );
  }

  let epubUrl: URL;

  try {
    epubUrl = new URL(epubUrlRaw);
  } catch {
    return NextResponse.json(
      { error: "Invalid EPUB URL" },
      { status: 400 },
    );
  }

  if (!["http:", "https:"].includes(epubUrl.protocol)) {
    return NextResponse.json(
      { error: "Unsupported EPUB URL protocol" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(epubUrl.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to download selected eBook" },
        { status: 502 },
      );
    }

    const bytes = await res.arrayBuffer();
    const contentType =
      res.headers.get("content-type") ?? "application/epub+zip";
    const contentDisposition = res.headers.get("content-disposition");

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=0, must-revalidate",
        ...(contentDisposition
          ? { "Content-Disposition": contentDisposition }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach EPUB source" },
      { status: 502 },
    );
  }
}
