import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  // -------------------------
  // Get Clerk user identification / token
  // -------------------------
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "backend" });
  if (!token) {
    return NextResponse.json(
      { error: "Missing backend token" },
      { status: 401 }
    );
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE_URL) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_API_URL is not set" },
      { status: 500 }
    );
  }

  const res = await fetch(`${API_BASE_URL}/library`, {
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
