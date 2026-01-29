import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const req_data = await req.json();

  const res = await fetch("http://localhost:8000/define_and_explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      src_words: req_data.src_words,
      tgt_words: req_data.tgt_words,
      src_spaces: req_data.src_spaces,
      tgt_spaces: req_data.tgt_spaces,
      src_sent_ids: req_data.src_sent_ids,
      tgt_sent_ids: req_data.tgt_sent_ids,
      tgt_to_src: req_data.tgt_to_src,
      tgt_idx: req_data.tgt_idx,
      src_lang: req_data.src_lang,
      tgt_lang: req_data.tgt_lang,
    }),
  });

  const res_data = await res.json();

  return NextResponse.json({
    lemma: res_data.lemma,
    pos: res_data.pos,
    gloss: res_data.gloss,
    ipa: res_data.ipa,
    explanation: res_data.explanation,
    examples: res_data.examples,
  });
}
