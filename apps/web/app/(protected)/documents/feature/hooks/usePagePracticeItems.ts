"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ReaderSession } from "../types/readerSession";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";

import { annotate } from "../api/annotate";
import { loadGlossaryItems } from "../api/glossaryItems";
import { makeAnnotateArgs } from "../types/annotate";
import {
  buildPracticeItemFromAnnotateResponse,
  makeAnnotationKey,
} from "../lib/practiceItemBuilders";


/**************************
 * `isPracticeableToken()`
 * -- Filter obvious non-word tokens
 *    out of the page practice pool
 **************************/
function isPracticeableToken(word: string): boolean {
  const trimmed = word.trim();

  if (!trimmed) return false;
  if (/^[\p{P}\p{S}]+$/u.test(trimmed)) return false;
  if (/^[0-9]+$/u.test(trimmed)) return false;

  return true;
}


/**************************
 * `shuffleWordIds()`
 * -- Randomize candidate selection
 *    so page practice feels fresh
 *    each time it is opened
 **************************/
function shuffleWordIds(wordIds: number[]): number[] {
  const next = [...wordIds];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}


/**************************
 * `getPagePracticeCandidateWordIds()`
 * -- Scan the current logical target
 *    page and pick random unsaved
 *    candidate word IDs
 **************************/
function getPagePracticeCandidateWordIds(args: {
  session: ReaderSession;
  isSwapped: boolean;
  excludedWordIds: Set<number>;
  maxCandidates?: number;
}): number[] {
  const { session, isSwapped, excludedWordIds, maxCandidates } = args;

  const tgt = isSwapped ? session.alignment.src : session.alignment.tgt;
  const targetToSource = isSwapped
    ? session.alignment.align.srcToTgt
    : session.alignment.align.tgtToSrc;

  const seenForms = new Set<string>();
  const eligibleCandidateIds: number[] = [];

  for (let wordId = 0; wordId < tgt.words.length; wordId += 1) {
    const form = tgt.words[wordId];

    if (!isPracticeableToken(form)) continue;
    if (excludedWordIds.has(wordId)) continue;
    if ((targetToSource[wordId] ?? []).length === 0) continue;

    const dedupeKey = form.trim().toLocaleLowerCase();
    if (seenForms.has(dedupeKey)) continue;

    seenForms.add(dedupeKey);
    eligibleCandidateIds.push(wordId);
  }

  const shuffledCandidateIds = shuffleWordIds(eligibleCandidateIds);

  if (maxCandidates == null) return shuffledCandidateIds;

  return shuffledCandidateIds.slice(0, maxCandidates);
}


/**************************
 * `usePagePracticeItems()`
 * -- Build new unsaved practice items for the current reader page
 **************************/
export function usePagePracticeItems(args: {
  open: boolean;
  session: ReaderSession | null;
  documentId: number | null;
  documentTitle: string;
  pageId: number | null;
  srcLang: string;
  tgtLang: string;
  uiLang: string;
  isSwapped: boolean;
  maxNewItems?: number;
}) {
  const {
    open,
    session,
    documentId,
    documentTitle,
    pageId,
    srcLang,
    tgtLang,
    uiLang,
    isSwapped,
    maxNewItems = 8,
  } = args;

  // -------------------------
  // Hook state
  // -------------------------
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreItems, setHasMoreItems] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Prevent older requests from winning
  const requestIdRef = useRef(0);
  const seenWordIdsRef = useRef<Set<number>>(new Set());
  const seenWordIdsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const nextSeenKey = open
      ? `${documentId ?? "x"}|${pageId ?? "x"}|${tgtLang}|${isSwapped ? "swapped" : "default"}`
      : null;

    if (seenWordIdsKeyRef.current === nextSeenKey) return;

    seenWordIdsRef.current = new Set();
    seenWordIdsKeyRef.current = nextSeenKey;
  }, [documentId, isSwapped, open, pageId, tgtLang]);

  const reload = useCallback(() => {
    setReloadNonce((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!session) return;
    if (documentId == null || pageId == null) return;

    const reqId = ++requestIdRef.current;
    const logicalSrcLang = isSwapped ? tgtLang : srcLang;
    const logicalTgtLang = isSwapped ? srcLang : tgtLang;

    // -------------------------
    // Begin page practice load
    // -------------------------
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        // -------------------------
        // Load saved glossary items
        // to exclude already-known
        // words from this page
        // -------------------------
        const { glossaryItems } = await loadGlossaryItems();
        if (requestIdRef.current !== reqId) return;

        const savedGlossaryItemsForPage = glossaryItems.filter(
          (item) =>
            item.definition.documentId === documentId &&
            item.definition.pageId === pageId &&
            item.tgtLang === logicalTgtLang
        );

        // -------------------------
        // Exclude already-saved page
        // words before selecting new
        // candidate practice tokens
        // -------------------------
        const excludedWordIds = new Set<number>([
          ...savedGlossaryItemsForPage.map((item) => item.definition.wordId),
          ...seenWordIdsRef.current,
        ]);

        const availableCandidateWordIds = getPagePracticeCandidateWordIds({
          session,
          isSwapped,
          excludedWordIds,
        });
        const candidateWordIds = availableCandidateWordIds.slice(0, maxNewItems);

        setHasMoreItems(availableCandidateWordIds.length > candidateWordIds.length);

        // -------------------------
        // Hydrate fresh page words
        // through the existing
        // annotate() pipeline
        // -------------------------
        const freshPracticeItems = await Promise.all(
          candidateWordIds.map(async (tgtIdx) => {
            const response = await annotate(
              makeAnnotateArgs({
                session,
                srcLang,
                tgtLang,
                uiLang,
                tgtIdx,
                isSwapped,
              })
            );

            return buildPracticeItemFromAnnotateResponse({
              annotateResponse: response,
              session,
              documentId,
              pageId,
              documentTitle,
              logicalSrcLang,
              logicalTgtLang,
              tgtIdx,
              isSwapped,
            });
          })
        );

        if (requestIdRef.current !== reqId) return;

        // -------------------------
        // Dedupe fresh items by
        // annotation key before
        // exposing them to the deck
        // -------------------------
        const deduped = Array.from(
          new Map(
            freshPracticeItems.map((item) => [
              makeAnnotationKey({
                documentId: item.definition.documentId,
                pageId: item.definition.pageId,
                tgtLang: item.tgtLang,
                wordId: item.definition.wordId,
              }),
              item,
            ])
          ).values()
        );

        for (const item of deduped) {
          seenWordIdsRef.current.add(item.definition.wordId);
        }

        setPracticeItems(deduped);
      } catch (e: unknown) {
        if (requestIdRef.current !== reqId) return;

        // -------------------------
        // Reset practice state on
        // load failure for this page
        // -------------------------
        setPracticeItems([]);
        setHasMoreItems(false);
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load page practice items"
        );
      } finally {
        if (requestIdRef.current === reqId) {
          setLoading(false);
        }
      }
    })();
  }, [
    open,
    session,
    documentId,
    documentTitle,
    pageId,
    srcLang,
    tgtLang,
    uiLang,
    isSwapped,
    maxNewItems,
    reloadNonce,
  ]);

  return {
    practiceItems,
    loading,
    error,
    hasMoreItems,
    reload,
  };
}
