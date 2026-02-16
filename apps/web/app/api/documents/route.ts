import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
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

  // -------------------------
  // Split document pages / save to database
  // -------------------------
  const { title, src_lang, tgt_lang, text } = await req.json();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_BASE_URL}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      src_lang,
      tgt_lang,
      text,
    }),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
