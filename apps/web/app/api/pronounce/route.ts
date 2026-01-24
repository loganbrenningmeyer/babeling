import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();

  const res = await fetch("http://localhost:8000/pronounce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
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