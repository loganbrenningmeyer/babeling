"use client";

import { usePronunciation } from "../hooks/usePronunciation";

export function PronounceButton({ 
  text,
}: { 
  text: string,
  pronunciation?: string | null,
}) {
  const { play, loading } = usePronunciation();

  return (
    <button
      type="button"
      disabled={loading || !text}
      onClick={() => play(text)}
      className="rounded-full  hover:bg-muted transition"
    >
      🔊
    </button>
  );
}