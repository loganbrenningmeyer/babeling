import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const req_data = await req.json();

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const res = await fetch(`${API_BASE_URL}/annotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      src_lang: req_data.srcLang,
      tgt_lang: req_data.tgtLang,
      src: {
        words: req_data.src.words,
        spaces: req_data.src.spaces,
        sent_ids: req_data.src.sentIds,
        par_ids: req_data.src.parIds,
      },
      tgt: {
        words: req_data.tgt.words,
        spaces: req_data.tgt.spaces,
        sent_ids: req_data.tgt.sentIds,
        par_ids: req_data.tgt.parIds,
      },
      tgt_to_src: req_data.tgtToSrc,
      tgt_idx: req_data.tgtIdx,
    }),
  });

  const res_data = await res.json();

  return NextResponse.json({
    definition: {
      form: res_data.definition.form,
      posForm: res_data.definition.pos_form,
      ipaForm: res_data.definition.ipa_form,

      lemma: res_data.definition.lemma,
      posLemma: res_data.definition.pos_lemma,
      ipaLemma: res_data.definition.ipa_lemma,

      gloss: res_data.definition.gloss,

      srcSent: res_data.definition.src_sentence,
      srcPar: res_data.definition.src_paragraph,
      tgtSent: res_data.definition.tgt_sentence,
      tgtPar: res_data.definition.tgt_paragraph,
    },
    usage: {
      explanation: res_data.usage.explanation,
      examples: res_data.usage.examples,
    },
  });
}
