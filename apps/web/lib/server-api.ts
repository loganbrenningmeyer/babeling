import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// -------------------------
// Get Clerk token
// -------------------------
export async function getBackendToken() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const token = await getToken({ template: "backend" });
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing backend token" },
        { status: 401 }
      ),
    };
  }

  return { token };
}

// -------------------------
// Get backend API url
// -------------------------
export function getApiBaseUrl() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE_URL) {
    return {
      error: NextResponse.json(
        { error: "NEXT_PUBLIC_API_URL is not set" },
        { status: 500 }
      ),
    };
  }
  return { API_BASE_URL };
}