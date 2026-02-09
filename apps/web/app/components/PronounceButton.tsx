"use client";

import { Volume2 } from "lucide-react";

import { usePronunciation } from "@/app/hooks/usePronunciation";

export function PronounceButton({ 
  text,
  label,
  tgtLang,
}: { 
  text: string,
  label: string,
  tgtLang?: string,
}) {
  const { play, loading } = usePronunciation();

  return (
    <button
      type="button"
      disabled={loading || !text}
      onClick={() => play(text, tgtLang)}
      className="
        inline-flex items-center gap-1
        cursor-pointer
        hover:font-semibold
        transition
      "
    >
      <span
        className="
          text-muted-foreground
          underline underline-offset-3
          decoration-dotted decoration-1
          decoration-muted-foreground
        "
      >
        {label}
      </span>

      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
