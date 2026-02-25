import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/server-api";


// -------------------------
// GET: /api/user_preferences
// -- Fetch user preferences or defaults if not saved
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
  // Return saved user preferences
  // -------------------------
  const res = await fetch(`${API_BASE_URL}/user_preferences`, {
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
// PATCH: /api/user_preferences
// -- Update/return user preferences or return defaults if not saved
// -------------------------
export async function PATCH(req: Request) {
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
  // Update user preferences / return
  // -------------------------
  const body = await req.json();

  const res = await fetch(`${API_BASE_URL}/user_preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}