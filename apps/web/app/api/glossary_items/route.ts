import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/sever-api";


// -------------------------
// POST: /api/glossary_items/
// -- Save glossary item to database
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
  // Save glossary item to database
  // -------------------------
  const body = await req.json();

  const res = await fetch(`${API_BASE_URL}/glossary_items`, {
    method: "POST",
    headers: {
      "content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}