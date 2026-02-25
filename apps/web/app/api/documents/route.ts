import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";


// -------------------------
// GET: /api/documents?document_id={id}
// -- Load saved document
// -------------------------
export async function GET(req: Request) {
  // -------------------------
  // Get Clerk token / API url
  // -------------------------
  const authResult = await getBackendToken();
  if ("error" in authResult) return authResult.error;

  const baseUrlResult = getApiBaseUrl();
  if ("error" in baseUrlResult) return baseUrlResult.error;

  const { token } = authResult;
  const { API_BASE_URL } = baseUrlResult;

  // -------------------------
  // Get saved Document by ID
  // -------------------------
  const url = new URL(req.url);
  const documentId = url.searchParams.get("document_id");

  const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status }); 
}

// -------------------------
// POST: /api/documents/
// -- Save document to database
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

  // -------------------------
  // Split document pages / save to database
  // -------------------------
  const { title, src_lang, text } = await req.json();

  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      src_lang,
      text,
    }),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
