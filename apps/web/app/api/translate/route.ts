import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { source, src_lang, tgt_lang } = await req.json();

    const API_BASE_URL = process.env.BABELING_API_BASE_URL;

    const res = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, src_lang, tgt_lang }),
    });

    const data = await res.json();

    return NextResponse.json({ source: data.source, target: data.target });
}
