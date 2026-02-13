import type { Session } from "@/types/session";

type TranslateResponse = {
  source: string;
  target: string;
};

export type AlignResponse = {
  src_words: string[];
  tgt_words: string[];
  src_to_tgt: Record<number, number[]>;
  tgt_to_src: Record<number, number[]>;
  src_spaces: string[];
  tgt_spaces: string[];
  src_sent_ids: number[];
  src_sent_to_par_ids: Record<number, number>;
  src_sent_to_word_ids: Record<number, number[]>;
  src_par_ids: number[];
  src_par_to_sent_ids: Record<number, number[]>;
  src_par_to_word_ids: Record<number, number[]>;
  tgt_sent_ids: number[];
  tgt_par_ids: number[];
};

export type DefineExplainRequest = {
  src_lang: string;
  tgt_lang: string;
  src_words: string[];
  tgt_words: string[];
  src_spaces: string[];
  tgt_spaces: string[];
  src_sent_ids: number[];
  tgt_sent_ids: number[];
  tgt_par_ids: number[];
  tgt_to_src: Record<number, number[]>;
  tgt_idx: number;
};

export type DefineExplainResponse = {
  word: string;
  sentence: string;
  paragraph: string;
  lemma: string;
  pos: string;
  gloss: string;
  ipa_lemma: string;
  ipa_form: string;
  explanation: string;
  examples: Array<{ source: string; target: string }>;
};

async function postJson<TResponse>(path: string, payload: unknown): Promise<TResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }

  if (!text) {
    throw new Error(`Empty response from ${path}`);
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new Error(`Invalid JSON response from ${path}`);
  }
}

export async function splitPages(text: string): Promise<string[]> {
  const data = await postJson<{ pages: string[] }>("/api/split_pages", { text });
  return data.pages;
}

export async function translateText(source: string, srcLang: string, tgtLang: string) {
  return postJson<TranslateResponse>("/api/translate", {
    source,
    src_lang: srcLang,
    tgt_lang: tgtLang,
  });
}

export async function alignText(source: string, target: string, srcLang: string, tgtLang: string) {
  return postJson<AlignResponse>("/api/align", {
    source,
    target,
    src_lang: srcLang,
    tgt_lang: tgtLang,
  });
}

export async function fetchDefineAndExplain(payload: DefineExplainRequest) {
  return postJson<DefineExplainResponse>("/api/define_and_explain", payload);
}

export function buildSession(source: string, target: string, alignData: AlignResponse): Session {
  return {
    sourceText: source,
    targetText: target,
    src: {
      words: alignData.src_words,
      spaces: alignData.src_spaces,
      sentIds: alignData.src_sent_ids,
      sentToParIds: alignData.src_sent_to_par_ids,
      sentToWordIds: alignData.src_sent_to_word_ids,
      parIds: alignData.src_par_ids,
      parToSentIds: alignData.src_par_to_sent_ids,
      parToWordIds: alignData.src_par_to_word_ids,
    },
    tgt: {
      words: alignData.tgt_words,
      spaces: alignData.tgt_spaces,
      sentIds: alignData.tgt_sent_ids,
      parIds: alignData.tgt_par_ids,
    },
    align: {
      srcToTgt: alignData.src_to_tgt,
      tgtToSrc: alignData.tgt_to_src,
    },
    state: {
      blurredSource: new Set(alignData.src_words.map((_, i) => i)),
      navSentId: -1,
      navParId: -1,
    },
  };
}
