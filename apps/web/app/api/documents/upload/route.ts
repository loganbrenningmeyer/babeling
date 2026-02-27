import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";


/**************************
 * POST: /api/documents/upload
 * -- Parse uploaded file and save as Document to database
 **************************/
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
  // Parse document file / save to database
  // -------------------------
  const form = await req.formData();

  const res = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}