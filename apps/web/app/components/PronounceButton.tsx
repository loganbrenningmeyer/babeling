"use client";

import { usePronunciation } from "../hooks/usePronunciation";

export function PronounceButton({ 
  text,
  tgtLang,
}: { 
  text: string,
  pronunciation?: string | null,
  tgtLang?: string,
}) {
  const { play, loading } = usePronunciation();

  return (
    <button
      type="button"
      disabled={loading || !text}
      onClick={() => play(text, tgtLang)}
      className="rounded-full  hover:bg-muted transition"
    >
      🔊
    </button>
  );
}
