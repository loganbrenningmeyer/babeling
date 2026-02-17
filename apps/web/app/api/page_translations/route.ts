import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/sever-api";


// -------------------------
// GET: /api/page_translation
// -- Load page translation for source/target language pair
// -------------------------
export async function GET(req: Request) {
  const authResult = await getBackendToken();
  if ("error" in authResult) return authResult.error;

  const baseUrlResult = getApiBaseUrl();
  if ("error" in baseUrlResult) return baseUrlResult.error;

  const { token } = authResult;
  const { API_BASE_URL } = baseUrlResult;

  // -------------------------
  // Load params from URL
  // -------------------------
  const url = new URL(req.url);
  const documentPageId = url.searchParams.get("document_page_id");
  const srcLang = url.searchParams.get("src_lang");
  const tgtLang = url.searchParams.get("tgt_lang");

  if (!documentPageId || !srcLang || !tgtLang) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // -------------------------
  // Set backend API URL params
  // -------------------------
  const backendUrl = new URL(`${API_BASE_URL}/page_translations`);
  backendUrl.searchParams.set("document_page_id", documentPageId);
  backendUrl.searchParams.set("src_lang", srcLang);
  backendUrl.searchParams.set("tgt_lang", tgtLang);

  // -------------------------
  // Load page translation
  // -------------------------
  const res = await fetch(backendUrl.toString(), {
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
// POST: /api/page_translations
// -- Save page translation for source/target language pair
// -------------------------
export async function POST(req: Request) {
  const authResult = await getBackendToken();
  if ("error" in authResult) return authResult.error;

  const baseUrlResult = getApiBaseUrl();
  if ("error" in baseUrlResult) return baseUrlResult.error;

  const { token } = authResult;
  const { API_BASE_URL } = baseUrlResult;

  const {
    document_page_id,
    src_lang,
    tgt_lang,
    translated_text,
    alignment_data,
  } = await req.json();

  if (
    !document_page_id ||
    !src_lang ||
    !tgt_lang ||
    !translated_text ||
    !alignment_data
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
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
