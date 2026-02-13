import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { source, target, src_lang, tgt_lang } = await req.json();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

    const res = await fetch(`${API_BASE_URL}/align`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            source,
            target,
            src_lang,
            tgt_lang,
         }),
    });

    const data = await res.json();

    return NextResponse.json({ 
        src_words: data.src_words,
        tgt_words: data.tgt_words,
        src_to_tgt: data.src_to_tgt,
        tgt_to_src: data.tgt_to_src,
        src_spaces: data.src_spaces,
        tgt_spaces: data.tgt_spaces,
        src_sent_ids: data.src_sent_ids,
        src_sent_to_par_ids: data.src_sent_to_par_ids,
        src_sent_to_word_ids: data.src_sent_to_word_ids,
        src_par_ids: data.src_par_ids,
        src_par_to_sent_ids: data.src_par_to_sent_ids,
        src_par_to_word_ids: data.src_par_to_word_ids,
        tgt_sent_ids: data.tgt_sent_ids,
        tgt_par_ids: data.tgt_par_ids,
     });
}
