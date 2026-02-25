import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";

// -------------------------
// GET: /api/library/documents
// -- Gets user's documents and their info for the library page
// -------------------------
export async function GET() {
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
  // Get user's documents
  // -------------------------
  const res = await fetch(`${API_BASE_URL}/library/documents`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorPayload =
      data && typeof data === "object" ? data : { error: text || "Request failed" };
    return NextResponse.json(errorPayload, { status: res.status });
  }

  if (Array.isArray(data)) {
    return NextResponse.json({ documents: data }, { status: res.status });
  }

  if (
    data &&
    typeof data === "object" &&
    "documents" in data &&
    Array.isArray((data as { documents: unknown }).documents)
  ) {
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ documents: [] }, { status: res.status });
}
