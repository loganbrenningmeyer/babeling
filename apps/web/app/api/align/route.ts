import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { source, target } = await req.json();

    const res = await fetch("http://localhost:8000/align", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            source,
            target,
         }),
    });

    const data = await res.json();

    return NextResponse.json({ 
        src_words: data.src_words,
        tgt_words: data.tgt_words,
        alignments: data.alignments,
     });
}