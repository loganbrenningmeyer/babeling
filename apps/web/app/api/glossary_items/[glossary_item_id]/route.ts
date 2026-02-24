import { NextResponse } from "next/server";
import { getBackendToken, getApiBaseUrl } from "@/lib/sever-api";


// -------------------------
// GET: /api/glossary_items/[glossary_item_id]
// -- Load saved glossary item
// -------------------------
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ glossary_item_id: string }> },
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
  // Get saved glossary item by ID
  // -------------------------
  const { glossary_item_id } = await params;

  const res = await fetch(`${API_BASE_URL}/glossary_items/${glossary_item_id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}


// -------------------------
// DELETE: /api/glossary_items/[glossary_item_id]
// -------------------------
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ glossary_item_id: string }> },
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
  // Delete saved glossary item by ID
  // -------------------------
  const { glossary_item_id } = await params;

  const res = await fetch(`${API_BASE_URL}/glossary_items/${glossary_item_id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}