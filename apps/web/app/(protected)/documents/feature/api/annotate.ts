import type { 
  AnnotateResponse, 
  AnnotateResponseDTO,
  AnnotateDomainData,
  AnnotateDomainDataDTO,
  AnnotateRequestDTO,
  AnnotateArgs,
} from "../types/annotate";

// -------------------------
// Helper to map frontend domain data -> backend domain data
// -------------------------
function toDomainDTO(d: AnnotateDomainData): AnnotateDomainDataDTO {
  return {
    words: d.words,
    spaces: d.spaces,
    sent_ids: d.sentIds,
    par_ids: d.parIds,
  };
}

/**************************
 * `annotate()`
 * -- Gets annotation information (definition, explanation, examples)
 **************************/
export async function annotate(args: AnnotateArgs): Promise<AnnotateResponse> {
  const body: AnnotateRequestDTO = {
    src_lang: args.srcLang,
    tgt_lang: args.tgtLang,
    ui_lang: args.uiLang,
    src: toDomainDTO(args.src),
    tgt: toDomainDTO(args.tgt),
    tgt_to_src: args.tgtToSrc,
    tgt_idx: args.tgtIdx,
  };

  const res = await fetch("/api/annotate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) { 
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to annotate");
  }

  const data = (await res.json()) as AnnotateResponseDTO;
  return {
    definition: {
      form: data.definition.form,
      posForm: data.definition.pos_form,
      ipaForm: data.definition.ipa_form,

      lemma: data.definition.lemma,
      posLemma: data.definition.pos_lemma,
      ipaLemma: data.definition.ipa_lemma,

      gloss: data.definition.gloss,

      srcSentence: data.definition.src_sentence,
      srcParagraph: data.definition.src_paragraph,
      tgtSentence: data.definition.tgt_sentence,
      tgtParagraph: data.definition.tgt_paragraph,
    },
    usage: {
      explanation: data.usage.explanation,
      examples: data.usage.examples,
    },
  };
}