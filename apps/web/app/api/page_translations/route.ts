import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // -------------------------
  // Get Clerk user identification / token
  // -------------------------
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "backend" });
  if (!token) {
    return NextResponse.json(
      { error: "Missing backend token" },
      { status: 401 }
    );
  }

  // -------------------------
  // Load or save page translation
  // -------------------------
  const {
    document_page_id,
    src_lang,
    tgt_lang,
    translated_text,
    alignment_data,
  } = await req.json();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 }
    );
  }

  // -------------------------
  // Load page translation
  // -------------------------
  if (translated_text === undefined && alignment_data === undefined) {
    if (!document_page_id || !src_lang || !tgt_lang) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const url = new URL(`${API_BASE_URL}/page_translations`);
    url.searchParams.set("document_page_id", String(document_page_id));
    url.searchParams.set("src_lang", src_lang);
    url.searchParams.set("tgt_lang", tgt_lang);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  // -------------------------
  // Save page translation
  // -------------------------
  const res = await fetch(`${API_BASE_URL}/page_translations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      document_page_id,
      src_lang,
      tgt_lang,
      translated_text,
      alignment_data,
    }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
