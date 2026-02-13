import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@/types/session";

import { SAMPLE_TEXTS_BY_LANG } from "../sampleTexts";
import { alignText, buildSession, splitPages, translateText } from "../api/client";

export function useReadingSession() {
  // Input/language state
  const [sourceText, setSourceText] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [srcLang, setSrcLang] = useState("en");
  const [tgtLang, setTgtLang] = useState("fr");

  // Sample state
  const [sampleId, setSampleId] = useState("");
  const [sampleLoading, setSampleLoading] = useState(false);

  // Reader/session state
  const [session, setSession] = useState<Session | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [pageId, setPageId] = useState(0);
  const pageCache = useRef<Map<number, Session>>(new Map());

  // UI state tied to session
  const [translationLoading, setTranslationLoading] = useState(false);
  const [showAligned, setShowAligned] = useState(false);
  const [blurredSource, setBlurredSource] = useState<Set<number>>(new Set());
  const [navSentId, setNavSentId] = useState(-1);
  const [navParId, setNavParId] = useState(-1);

  const sampleOptions = useMemo(() => SAMPLE_TEXTS_BY_LANG[srcLang] ?? [], [srcLang]);
  const selectedSample = sampleOptions.find((entry) => entry.id === sampleId) ?? null;
  const canTranslate = sourceText.trim().length > 0 || !!sourceFile;

  const handleSwapLanguages = useCallback(() => {
    setSrcLang(tgtLang);
    setTgtLang(srcLang);
  }, [srcLang, tgtLang]);

  const handleSampleSelect = useCallback(
    async (nextId: string) => {
      setSampleId(nextId);
      if (!nextId) return;

      const sample = sampleOptions.find((entry) => entry.id === nextId);
      if (!sample) return;

      setSampleLoading(true);
      try {
        const res = await fetch(
          `/texts/${encodeURIComponent(srcLang)}/${encodeURIComponent(sample.filename)}`
        );

        if (!res.ok) {
          throw new Error("Failed to load sample text");
        }

        const text = await res.text();
        setSourceFile(null);
        setSourceText(text);
      } catch (err) {
        console.error(err);
      } finally {
        setSampleLoading(false);
      }
    },
    [sampleOptions, srcLang]
  );

  const translateAndAlign = useCallback(
    async (text: string): Promise<Session | null> => {
      if (!text.trim()) return null;

      setTranslationLoading(true);
      try {
        const translated = await translateText(text, srcLang, tgtLang);
        const aligned = await alignText(translated.source, translated.target, srcLang, tgtLang);
        return buildSession(translated.source, translated.target, aligned);
      } catch (err) {
        console.error(err);
        return null;
      } finally {
        setTranslationLoading(false);
      }
    },
    [srcLang, tgtLang]
  );

  const loadPageSession = useCallback(
    async (pid: number, pagesArg?: string[]) => {
      // Reset reveal navigation state before loading page
      setNavSentId(-1);
      setNavParId(-1);

      const pagesLocal = pagesArg ?? pages;

      const cachedSession = pageCache.current.get(pid);
      if (cachedSession) {
        setSession(cachedSession);
        setBlurredSource(new Set(cachedSession.state.blurredSource));
        setNavSentId(cachedSession.state.navSentId);
        setNavParId(cachedSession.state.navParId);
        setShowAligned(true);
        setPageId(pid);
        return;
      }

      const pageText = pagesLocal[pid] ?? "";
      if (!pageText.trim()) return;

      setPageId(pid);

      const nextSession = await translateAndAlign(pageText);
      if (!nextSession) return;

      pageCache.current.set(pid, nextSession);
      setSession(nextSession);
      setBlurredSource(new Set(nextSession.src.words.map((_, i) => i)));
      setShowAligned(true);
    },
    [pages, translateAndAlign]
  );

  const startReadingSession = useCallback(async () => {
    if (!sourceText.trim() && !sourceFile) return;

    const fullText = sourceFile ? await sourceFile.text() : sourceText;

    try {
      setShowAligned(false);
      const newPages = await splitPages(fullText);
      setPages(newPages);
      setPageId(0);

      pageCache.current.clear();
      setSession(null);
      setBlurredSource(new Set());
      setNavSentId(-1);
      setNavParId(-1);

      await loadPageSession(0, newPages);
    } catch (err) {
      console.error(err);
    }
  }, [loadPageSession, sourceFile, sourceText]);

  const updateCachedState = useCallback(
    (pid: number) => {
      if (!session) return;

      const updatedSession: Session = {
        ...session,
        state: {
          blurredSource: new Set(blurredSource),
          navSentId,
          navParId,
        },
      };

      pageCache.current.set(pid, updatedSession);
      setSession(updatedSession);
    },
    [blurredSource, navParId, navSentId, session]
  );

  const goPrevPage = useCallback(async () => {
    const prev = pageId - 1;
    if (prev < 0) return;
    updateCachedState(pageId);
    await loadPageSession(prev);
  }, [loadPageSession, pageId, updateCachedState]);

  const goNextPage = useCallback(async () => {
    const next = pageId + 1;
    if (next >= pages.length) return;
    updateCachedState(pageId);
    await loadPageSession(next);
  }, [loadPageSession, pageId, pages.length, updateCachedState]);

  useEffect(() => {
    setSampleId("");
  }, [srcLang]);

  return {
    sourceText,
    setSourceText,
    sourceFile,
    setSourceFile,
    srcLang,
    setSrcLang,
    tgtLang,
    setTgtLang,
    handleSwapLanguages,

    sampleId,
    setSampleId,
    sampleLoading,
    sampleOptions,
    selectedSample,
    handleSampleSelect,

    session,
    pages,
    pageId,
    translationLoading,
    showAligned,
    blurredSource,
    setBlurredSource,
    navSentId,
    setNavSentId,
    navParId,
    setNavParId,

    canTranslate,
    startReadingSession,
    goPrevPage,
    goNextPage,
  };
}
