import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";

// -------------------------
// POST: /api/read_progress
// -- Save reading progress for a user/document/tgt_lang
// -------------------------
export async function POST(req: Request) {
  // -------------------------
  // Get Clerk token / API url
  // -------------------------
  const authResult = await getBackendToken();
  if ("error" in authResult) return authResult.error;

  const baseUrlResult = getApiBaseUrl();
  if ("error" in baseUrlResult) return baseUrlResult.error;

  const { token } = authResult;
  const { API_BASE_URL } = baseUrlResult;

  const { document_id, tgt_lang, current_page_number } = await req.json();

  if (
    !document_id ||
    !tgt_lang ||
    !current_page_number ||
    !Number.isFinite(Number(document_id)) ||
    !Number.isFinite(Number(current_page_number))
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const res = await fetch(`${API_BASE_URL}/read_progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      document_id,
      tgt_lang,
      current_page_number,
    }),
    cache: "no-store",
  });

  // -------------------------
  // Handle improper JSON return gracefully
  // -- Receive text and attempt to parse
  // -------------------------
  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || "Request failed" };
  }

  return NextResponse.json(data, { status: res.status });
}