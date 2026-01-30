import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text, tgt_lang } = await req.json();

  const API_BASE_URL = process.env.BABELING_API_BASE_URL;

  const res = await fetch(`${API_BASE_URL}/pronounce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      tgt_lang,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    return new NextResponse(msg || "Pronounce failed", { status: res.status });
  }

  const buf = await res.arrayBuffer();

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "no-store",
    }
  });
}
