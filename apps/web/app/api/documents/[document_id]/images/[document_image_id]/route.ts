import { getApiBaseUrl, getBackendToken } from "@/lib/server-api";

// -------------------------
// GET: /api/documents/[document_id]/images/[document_image_id]
// -- Proxies authenticated document image bytes from the backend API
// -------------------------
export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ document_id: string; document_image_id: string }>;
  },
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
  // Resolve route params
  // -------------------------
  const { document_id, document_image_id } = await params;

  // -------------------------
  // Proxy image bytes from backend
  // -- The backend route is auth-protected, so the browser cannot call it directly
  // -------------------------
  const res = await fetch(
    `${API_BASE_URL}/documents/${document_id}/images/${document_image_id}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  // -------------------------
  // Forward cache + content headers
  // -- Preserve the backend response shape so the browser treats this as an image
  // -------------------------
  const headers = new Headers();
  const contentType = res.headers.get("content-type");
  const contentLength = res.headers.get("content-length");
  const cacheControl = res.headers.get("cache-control");
  const etag = res.headers.get("etag");

  if (contentType) headers.set("Content-Type", contentType);
  if (contentLength) headers.set("Content-Length", contentLength);
  if (cacheControl) headers.set("Cache-Control", cacheControl);
  if (etag) headers.set("ETag", etag);

  // -------------------------
  // Return streamed image response
  // -------------------------
  return new Response(res.body, {
    status: res.status,
    headers,
  });
}
