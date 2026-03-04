import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type ThemePref = "system" | "light" | "dark";

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

// -------------------------
// Get saved theme for initial SSR
// -------------------------
export async function getInitialTheme(): Promise<ThemePref | null> {
  const { userId, getToken } = await auth();
  if (!userId) {
    return null;
  }

  const token = await getToken({ template: "backend" });
  if (!token) {
    return null;
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_BASE_URL) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/user_preferences`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as { theme?: unknown };
    if (
      data.theme === "system" ||
      data.theme === "light" ||
      data.theme === "dark"
    ) {
      return data.theme;
    }
  } catch {
    return null;
  }

  return null;
}
