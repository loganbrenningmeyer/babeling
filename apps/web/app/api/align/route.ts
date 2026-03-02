import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { paragraphs, src_lang, tgt_lang } = await req.json();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_BASE_URL}/align`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paragraphs,
      src_lang,
      tgt_lang,
    }),
  });

  const data = await res.json();

  return NextResponse.json(
    {
      src: {
        words: data.src.words,
        spaces: data.src.spaces,
        sentIds: data.src.sent_ids,
        parIds: data.src.par_ids,
        sentToParIds: data.src.sent_to_par_ids,
        sentToWordIds: data.src.sent_to_word_ids,
        parToSentIds: data.src.par_to_sent_ids,
        parToWordIds: data.src.par_to_word_ids,
      },
      tgt: {
        words: data.tgt.words,
        spaces: data.tgt.spaces,
        sentIds: data.tgt.sent_ids,
        parIds: data.tgt.par_ids,
        sentToParIds: data.tgt.sent_to_par_ids,
        sentToWordIds: data.tgt.sent_to_word_ids,
        parToSentIds: data.tgt.par_to_sent_ids,
        parToWordIds: data.tgt.par_to_word_ids,
      },
      align: {
        srcToTgt: data.align.src_to_tgt,
        tgtToSrc: data.align.tgt_to_src,
      },
    },
    { status: res.status }
  );
}
