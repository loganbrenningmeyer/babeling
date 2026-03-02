import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { source_text, src_lang, tgt_lang } = await req.json();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_BASE_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source_text, src_lang, tgt_lang }),
  });

  const data = await res.json();

  return NextResponse.json(data, { status: res.status });
}
