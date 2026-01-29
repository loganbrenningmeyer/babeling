"use client";

import { useRef, useState, useCallback } from "react";

export function usePronunciation() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // -------------------------
  // Stop audio playback
  // -------------------------
  const cleanup = useCallback(() => {
    const audio = audioRef.current;
    const url = urlRef.current;

    // drop refs first so handlers can't re-enter and mess with state
    audioRef.current = null;
    urlRef.current = null;

    if (audio) {
      // IMPORTANT: detach handlers BEFORE touching source
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;

      try {
        audio.pause();
      } catch {}
    }

    if (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setLoading(false);
  }, [cleanup]);

  // -------------------------
  // Play audio
  // -------------------------
  const play = useCallback(
    async (text: string, tgtLang?: string) => {
      setError(null);
      setLoading(true);

      try {
        cleanup();
        
        const res = await fetch("/api/pronounce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, tgt_lang: tgtLang }),
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Pronounce failed (${res.status}) ${msg}`);
        }
        
        const buf = await res.arrayBuffer();
        const blob = new Blob([buf], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => stop();
        audio.onerror = (e) => {
          console.error("Audio error event:", e);
          console.error("MediaError:", audio.error)

          if (audio.error) {
            console.error("MediaError code:", audio.error.code);
            console.error("MediaError message:", audio.error.message);
          }
        };

        audio.load();

        await audio.play();

      } catch (e: any) {
        setError(e?.message ?? "Pronounce failed");
        stop();

      } finally {
        if (!audioRef.current) setLoading(false);
      }
    },
    [cleanup, stop]
  );

  return { play, stop, loading, error };
}
