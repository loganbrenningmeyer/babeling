import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { src_lang, tgt_lang, text } = await req.json();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${API_BASE_URL}/split_pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            src_lang,
            tgt_lang,
            text,
        }),
    });

    const data = await res.json();

    return NextResponse.json({ pages: data.pages });
}