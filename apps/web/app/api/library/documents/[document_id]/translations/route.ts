import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";

// -------------------------
// GET: /api/library/documents/[document_id]/translations
// -- Gets user's translations for the given documentId
// -------------------------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ document_id: string }> },
) {
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
  // Get translations for given document_id
  // -------------------------
  const { document_id } = await params;

  const res = await fetch(`${API_BASE_URL}/library/documents/${document_id}/translations`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}