import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const req_data = await req.json();

    const res = await fetch("http://localhost:8000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            src_words: req_data.src_words,
            tgt_words: req_data.tgt_words,
            src_spaces: req_data.src_spaces,
            tgt_spaces: req_data.tgt_spaces,
            tgt_to_src: req_data.tgt_to_src,
            tgt_idx: req_data.tgt_idx
        })
    });

    const res_data = await res.json();

    return NextResponse.json({ 
        explanation: res_data.explanation, 
        definition: res_data.definition 
    });
}