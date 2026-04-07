# Reader Page Practice Plan

This document describes the recommended architecture for adding page-based practice to the reader while reusing the shared practice deck and card system under `apps/web/app/(protected)/practice`.

The goal is to let users practice:

- words they have already saved to glossary on the current page
- new candidate words from the current page that have not been saved yet

The key recommendation is:

- keep the reader as the source of truth for page/session token data
- extract practice-item building logic from the annotate popover path
- convert both saved and unsaved words into one neutral `PracticeItem` shape
- make the practice deck consume `PracticeItem[]`, not `LibraryGlossaryItem[]`

## 1. Current State

### What already works

- `ReaderPageClient` owns document, page, and session state.
- `usePageSession` provides tokenized/aligned page data.
- `useAnnotatePopover` already knows how to turn a clicked page word into:
  - annotation request args
  - glossary-grade `definition`
  - `usage`
  - `contextAlignment`
- `PracticeDeck` already handles:
  - queueing
  - transitions
  - card selection
  - recognition choice generation

### Current limitation

`PracticeDeck` and the practice cards currently depend on `LibraryGlossaryItem`:

```ts
export function PracticeDeck({
  glossaryItems,
}: {
  glossaryItems: LibraryGlossaryItem[];
}) {
  // ...
}
```

That works for the review page, but it couples practice to saved library rows. For reader practice, that is the wrong boundary because unsaved page words do not have:

- `glossaryItemId`
- `createdAt`
- a library origin

But they *can* still have:

- `definition`
- `usage`
- `contextAlignment`
- `document/page/word location`

That is enough to power the cards.

## 2. Recommended Target Architecture

### Summary

Build a neutral practice feature pipeline:

1. Reader page selects candidate target words from the current page.
2. Reader page loads saved glossary items for the page.
3. Unsaved candidate words are hydrated through the existing annotate path.
4. Saved and unsaved items are normalized into one `PracticeItem` type.
5. `PracticeDeck` renders `PracticeItem[]`.
6. Reader opens a practice dialog above the page and mounts the deck.

### Recommended ownership

- `ReaderPageClient`
  - owns `practiceOpen`
  - owns loading/refresh of page practice items
  - suppresses reader keyboard navigation while practice is open

- `ReaderShell`
  - remains presentational
  - exposes a footer practice button callback
  - optionally displays `practiceCount`

- `PracticeDeck`
  - remains deck/session UI
  - becomes data-model-neutral

- `documents/feature/lib/*`
  - holds the extracted annotate-to-practice builders

## 3. New Core Type: `PracticeItem`

Create a neutral type under:

- `apps/web/app/(protected)/practice/feature/types/practiceItem.ts`

Recommended shape:

```ts
import type {
  GlossaryItemDefinition,
  GlossaryItemUsage,
} from "@/app/(protected)/documents/feature/types/glossaryItem";

export type PracticeItemSource = "saved" | "page";

export type PracticeItem = {
  practiceItemId: string;
  source: PracticeItemSource;

  savedGlossaryItemId: number | null;

  documentTitle: string;
  srcLang: string;
  tgtLang: string;

  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
};
```

### Why this type is correct

- It preserves everything the current cards need.
- It removes the requirement that every item must exist in the library DB.
- It gives the deck a stable string ID for queueing and seeding.
- It lets the UI distinguish saved items from page-only items when needed.

## 4. Convert Saved Glossary Items Into `PracticeItem`

Create a mapper under:

- `apps/web/app/(protected)/practice/feature/lib/toPracticeItem.ts`

```ts
import type { LibraryGlossaryItem } from "@/app/(protected)/library/feature/types/glossaryItem";
import type { PracticeItem } from "../types/practiceItem";

export function makePracticeItemKey(args: {
  documentId: number;
  pageId: number;
  tgtLang: string;
  wordId: number;
}) {
  const { documentId, pageId, tgtLang, wordId } = args;
  return `${documentId}|${pageId}|${tgtLang}|${wordId}`;
}

export function fromLibraryGlossaryItem(
  glossaryItem: LibraryGlossaryItem
): PracticeItem {
  return {
    practiceItemId: makePracticeItemKey({
      documentId: glossaryItem.definition.documentId,
      pageId: glossaryItem.definition.pageId,
      tgtLang: glossaryItem.tgtLang,
      wordId: glossaryItem.definition.wordId,
    }),
    source: "saved",
    savedGlossaryItemId: glossaryItem.glossaryItemId,
    documentTitle: glossaryItem.documentTitle,
    srcLang: glossaryItem.srcLang,
    tgtLang: glossaryItem.tgtLang,
    definition: glossaryItem.definition,
    usage: glossaryItem.usage,
  };
}
```

This deliberately reuses the same identity concept already used by the annotate popover.

## 5. Extract Shared Annotate-to-Practice Builders

Right now, the reader already has the logic needed to produce glossary-grade practice data for a clicked word, but it is trapped inside `useAnnotatePopover`.

Extract the reusable parts from:

- `apps/web/app/(protected)/documents/feature/hooks/useAnnotatePopover.ts`

into:

- `apps/web/app/(protected)/documents/feature/lib/practiceItemBuilders.ts`

### Functions to extract

- `makeAnnotationKey`
- `buildContextTokenSlice`
- `buildGlossaryContextAlignment`
- a new function that converts `annotate()` response into a `PracticeItem`

Recommended extracted module:

```ts
import type { ReaderSession } from "../types/readerSession";
import type { TokenBlock } from "../types/pageTranslation";
import type {
  GlossaryContextAlignment,
  GlossaryContextTokenSlice,
} from "../types/glossaryItem";
import type { AnnotateResponse } from "../types/annotate";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";

export function makeAnnotationKey(args: {
  documentId: number;
  pageId: number;
  tgtLang: string;
  wordId: number;
}) {
  const { documentId, pageId, tgtLang, wordId } = args;
  return `${documentId}|${pageId}|${tgtLang}|${wordId}`;
}

export function buildContextTokenSlice(args: {
  block: TokenBlock;
  sliceGlobalWordIds: number[];
  highlightedGlobalWordIds: Set<number>;
}): GlossaryContextTokenSlice {
  const { block, sliceGlobalWordIds, highlightedGlobalWordIds } = args;

  const ids = sliceGlobalWordIds.filter(
    (i) => i >= 0 && i < block.words.length && i < block.spaces.length
  );

  return {
    words: ids.map((i) => block.words[i]),
    spaces: ids.map((i) => block.spaces[i]),
    globalWordIds: ids,
    highlightedLocalWordIds: ids.reduce<number[]>((acc, globalIdx, localIdx) => {
      if (highlightedGlobalWordIds.has(globalIdx)) acc.push(localIdx);
      return acc;
    }, []),
  };
}

export function buildGlossaryContextAlignment(args: {
  session: ReaderSession;
  tgtIdx: number;
  isSwapped: boolean;
}): GlossaryContextAlignment {
  const { session, tgtIdx, isSwapped } = args;

  const src = isSwapped ? session.alignment.tgt : session.alignment.src;
  const tgt = isSwapped ? session.alignment.src : session.alignment.tgt;
  const targetToSource = isSwapped
    ? session.alignment.align.srcToTgt
    : session.alignment.align.tgtToSrc;

  const sentId = tgt.sentIds[tgtIdx];
  const parId = tgt.parIds[tgtIdx];

  const srcAlignedGlobal = new Set(targetToSource[tgtIdx] ?? []);
  const tgtClickedGlobal = new Set([tgtIdx]);

  return {
    sentence: {
      src: buildContextTokenSlice({
        block: src,
        sliceGlobalWordIds: src.sentToWordIds[sentId],
        highlightedGlobalWordIds: srcAlignedGlobal,
      }),
      tgt: buildContextTokenSlice({
        block: tgt,
        sliceGlobalWordIds: tgt.sentToWordIds[sentId],
        highlightedGlobalWordIds: tgtClickedGlobal,
      }),
    },
    paragraph: {
      src: buildContextTokenSlice({
        block: src,
        sliceGlobalWordIds: src.parToWordIds[parId],
        highlightedGlobalWordIds: srcAlignedGlobal,
      }),
      tgt: buildContextTokenSlice({
        block: tgt,
        sliceGlobalWordIds: tgt.parToWordIds[parId],
        highlightedGlobalWordIds: tgtClickedGlobal,
      }),
    },
  };
}

export function buildPracticeItemFromAnnotation(args: {
  annotateResponse: AnnotateResponse;
  session: ReaderSession;
  documentId: number;
  pageId: number;
  documentTitle: string;
  srcLang: string;
  tgtLang: string;
  tgtIdx: number;
  isSwapped: boolean;
}): PracticeItem {
  const {
    annotateResponse,
    session,
    documentId,
    pageId,
    documentTitle,
    srcLang,
    tgtLang,
    tgtIdx,
    isSwapped,
  } = args;

  const logicalSrcLang = isSwapped ? tgtLang : srcLang;
  const logicalTgtLang = isSwapped ? srcLang : tgtLang;
  const logicalTgt = isSwapped ? session.alignment.src : session.alignment.tgt;

  const sentId = logicalTgt.sentIds[tgtIdx];
  const parId = logicalTgt.parIds[tgtIdx];

  return {
    practiceItemId: makeAnnotationKey({
      documentId,
      pageId,
      tgtLang: logicalTgtLang,
      wordId: tgtIdx,
    }),
    source: "page",
    savedGlossaryItemId: null,
    documentTitle,
    srcLang: logicalSrcLang,
    tgtLang: logicalTgtLang,
    definition: {
      form: annotateResponse.definition.form,
      posForm: annotateResponse.definition.posForm || null,
      ipaForm: annotateResponse.definition.ipaForm || null,
      lemma: annotateResponse.definition.lemma || null,
      posLemma: annotateResponse.definition.posLemma || null,
      ipaLemma: annotateResponse.definition.ipaLemma || null,
      gloss: annotateResponse.definition.gloss,
      srcSentence: annotateResponse.definition.srcSentence,
      srcParagraph: annotateResponse.definition.srcParagraph,
      tgtSentence: annotateResponse.definition.tgtSentence,
      tgtParagraph: annotateResponse.definition.tgtParagraph,
      contextAlignment: buildGlossaryContextAlignment({
        session,
        tgtIdx,
        isSwapped,
      }),
      documentId,
      pageId,
      sentId,
      parId,
      wordId: tgtIdx,
    },
    usage: {
      explanation: annotateResponse.usage.explanation,
      examples: annotateResponse.usage.examples,
    },
  };
}
```

## 6. Refactor `PracticeDeck` to Use `PracticeItem[]`

Update:

- `apps/web/app/(protected)/practice/feature/components/PracticeDeck.tsx`

### Existing signature

```ts
export function PracticeDeck({
  glossaryItems,
}: {
  glossaryItems: LibraryGlossaryItem[];
}) {
  // ...
}
```

### Recommended new signature

```ts
import type { PracticeItem } from "../types/practiceItem";

export function PracticeDeck({
  practiceItems,
  emptyState,
  onRemainingChange,
}: {
  practiceItems: PracticeItem[];
  emptyState?: ReactNode;
  onRemainingChange?: (remaining: number) => void;
}) {
  // ...
}
```

### Queue changes

Replace `glossaryItemId`-based queueing with `practiceItemId`:

```ts
const [queue, setQueue] = useState<string[]>([]);
const [cardTypeById, setCardTypeById] = useState<Record<string, PracticeCardType>>({});
const [recognitionChoicesById, setRecognitionChoicesById] = useState<
  Record<string, RecognitionChoice[]>
>({});
```

Initialize from `practiceItems`:

```ts
useEffect(() => {
  const ids = practiceItems.map((item) => item.practiceItemId);
  const shuffledIds = shuffleIds(ids);
  const sessionSeed = Math.floor(Math.random() * 4294967296);

  setQueue(shuffledIds);
  setCardTypeById(
    Object.fromEntries(
      shuffledIds.map((id) => [id, getRandomCardType()])
    ) as Record<string, PracticeCardType>
  );

  setRecognitionChoicesById(
    Object.fromEntries(
      practiceItems.map((item) => [
        item.practiceItemId,
        buildRecognitionChoices({
          practiceItem: item,
          practiceItems,
          choiceSeed: sessionSeed,
        }),
      ])
    ) as Record<string, RecognitionChoice[]>
  );

  setTransitionAction(null);
}, [practiceItems]);
```

Build lookup table:

```ts
const practiceById = useMemo(
  () => Object.fromEntries(practiceItems.map((item) => [item.practiceItemId, item])),
  [practiceItems]
);
```

### Card renderer change

```ts
function renderPracticeCard(args: {
  cardType: PracticeCardType | null;
  practiceItem: PracticeItem;
  practiceItems: PracticeItem[];
  recognitionChoicesById: Record<string, RecognitionChoice[]>;
}) {
  const { cardType, practiceItem, practiceItems, recognitionChoicesById } = args;

  if (cardType === "recognition") {
    const recognitionChoices = recognitionChoicesById[practiceItem.practiceItemId];
    if (!recognitionChoices) return null;

    return (
      <RecognitionCard
        practiceItem={practiceItem}
        choices={recognitionChoices}
      />
    );
  }

  if (cardType === "definition") {
    return <DefinitionCard practiceItem={practiceItem} />;
  }

  return <ContextClozeCard practiceItem={practiceItem} />;
}
```

## 7. Update Cards to Accept `PracticeItem`

Update:

- `DefinitionCard.tsx`
- `RecognitionCard.tsx`
- `ContextClozeCard.tsx`
- `GlossaryInfoOverlay.tsx`

The change is mostly mechanical:

```ts
import type { PracticeItem } from "../../types/practiceItem";

export function DefinitionCard({
  practiceItem,
}: {
  practiceItem: PracticeItem;
}) {
  return <>{practiceItem.definition.form}</>;
}
```

### Why keep the overlay working the same way

The current glossary info overlay uses `GlossaryItemBack`, which expects a `LibraryGlossaryItem`. That means you have two options:

#### Option A: Refactor `GlossaryItemBack`

Preferred long-term option. Make `GlossaryItemBack` accept a neutral data shape rather than a full library row.

#### Option B: Add an adapter

Faster path. Create a thin mapper from `PracticeItem` to a view-model object used by the overlay.

Recommended direction: **Option A**, because page practice should not have to pretend it is a library card.

Example target prop shape:

```ts
export type GlossaryCardData = {
  documentTitle: string;
  srcLang: string;
  tgtLang: string;
  definition: GlossaryItemDefinition;
  usage: GlossaryItemUsage;
};
```

Then:

```ts
export function GlossaryInfoOverlay({
  practiceItem,
  enabled,
}: {
  practiceItem: PracticeItem;
  enabled: boolean;
}) {
  // ...
}
```

## 8. Add Candidate Selection for New Page Words

Create:

- `apps/web/app/(protected)/documents/feature/lib/pagePracticeCandidates.ts`

Recommended responsibilities:

- inspect current logical target token stream
- reject punctuation-only tokens
- reject duplicates
- reject tokens already saved on this page
- require at least one alignment
- rank candidates in reading order

Example:

```ts
import type { ReaderSession } from "../types/readerSession";

function isPracticeableToken(word: string) {
  if (!word.trim()) return false;
  if (/^[\\p{P}\\p{S}]+$/u.test(word)) return false;
  if (/^[0-9]+$/.test(word)) return false;
  return true;
}

export function getPagePracticeCandidateWordIds(args: {
  session: ReaderSession;
  isSwapped: boolean;
  excludedWordIds: Set<number>;
  maxCandidates: number;
}): number[] {
  const { session, isSwapped, excludedWordIds, maxCandidates } = args;

  const tgt = isSwapped ? session.alignment.src : session.alignment.tgt;
  const targetToSource = isSwapped
    ? session.alignment.align.srcToTgt
    : session.alignment.align.tgtToSrc;

  const seenForms = new Set<string>();
  const candidateIds: number[] = [];

  for (let wordId = 0; wordId < tgt.words.length; wordId += 1) {
    const form = tgt.words[wordId];
    if (!isPracticeableToken(form)) continue;
    if (excludedWordIds.has(wordId)) continue;

    const aligned = targetToSource[wordId] ?? [];
    if (aligned.length === 0) continue;

    const dedupeKey = form.trim().toLocaleLowerCase();
    if (seenForms.has(dedupeKey)) continue;

    seenForms.add(dedupeKey);
    candidateIds.push(wordId);

    if (candidateIds.length >= maxCandidates) break;
  }

  return candidateIds;
}
```

### Notes on candidate quality

This is the correct first pass because it is deterministic and cheap.

Later improvements can add:

- POS-based filtering
- prefer clicked words
- frequency-based filtering
- skip stop words
- allow repeated forms if they occur in different contexts

But do not start with those. Keep the first version stable and understandable.

## 9. Add a Page-Scoped Practice Hook

Create:

- `apps/web/app/(protected)/documents/feature/hooks/usePagePracticeItems.ts`

This hook should:

1. Load saved glossary items for current page.
2. Convert them to `PracticeItem`.
3. Compute excluded word IDs from those saved items.
4. Select unsaved page candidates.
5. Hydrate unsaved candidates by calling `annotate()`.
6. Convert annotate responses into `PracticeItem`.
7. Merge and dedupe.

Recommended API:

```ts
import { useEffect, useMemo, useRef, useState } from "react";

import { annotate } from "../api/annotate";
import { loadGlossaryItems } from "../api/glossaryItems";
import { makeAnnotateArgs } from "../types/annotate";
import { getPagePracticeCandidateWordIds } from "../lib/pagePracticeCandidates";
import {
  buildPracticeItemFromAnnotation,
  makeAnnotationKey,
} from "../lib/practiceItemBuilders";
import { fromLibraryGlossaryItem } from "@/app/(protected)/practice/feature/lib/toPracticeItem";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";
import type { ReaderSession } from "../types/readerSession";

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

  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (!session || documentId == null || pageId == null) return;

    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const allSaved = await loadGlossaryItems();
        if (requestIdRef.current !== reqId) return;

        const logicalTgtLang = isSwapped ? srcLang : tgtLang;

        const savedForPage = allSaved.glossaryItems.filter(
          (item) =>
            item.definition.documentId === documentId &&
            item.definition.pageId === pageId &&
            item.tgtLang === logicalTgtLang
        );

        const savedPracticeItems = savedForPage.map(fromLibraryGlossaryItem);
        const excludedWordIds = new Set(
          savedForPage.map((item) => item.definition.wordId)
        );

        const candidateWordIds = getPagePracticeCandidateWordIds({
          session,
          isSwapped,
          excludedWordIds,
          maxCandidates: maxNewItems,
        });

        const freshPracticeItems: PracticeItem[] = [];

        for (const tgtIdx of candidateWordIds) {
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

          if (requestIdRef.current !== reqId) return;

          freshPracticeItems.push(
            buildPracticeItemFromAnnotation({
              annotateResponse: response,
              session,
              documentId,
              pageId,
              documentTitle,
              srcLang,
              tgtLang,
              tgtIdx,
              isSwapped,
            })
          );
        }

        const merged = [...savedPracticeItems, ...freshPracticeItems];
        const deduped = Array.from(
          new Map(merged.map((item) => [item.practiceItemId, item])).values()
        );

        setPracticeItems(deduped);
      } catch (e: any) {
        if (requestIdRef.current !== reqId) return;
        setPracticeItems([]);
        setError(e?.message ?? "Failed to build page practice items");
      } finally {
        if (requestIdRef.current === reqId) setLoading(false);
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
  ]);

  return {
    practiceItems,
    loading,
    error,
  };
}
```

## 10. Add a Reader Practice Dialog

Create:

- `apps/web/app/(protected)/documents/feature/components/Practice/ReaderPracticeDialog.tsx`

Use `Dialog` as the overlay shell. The reader should remain visible behind it.

Recommended component:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { PracticeDeck } from "@/app/(protected)/practice/feature/components/PracticeDeck";
import type { PracticeItem } from "@/app/(protected)/practice/feature/types/practiceItem";

export function ReaderPracticeDialog({
  open,
  onOpenChange,
  practiceItems,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practiceItems: PracticeItem[];
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          max-w-5xl border-none bg-transparent p-0 shadow-none
          [&>button]:right-6 [&>button]:top-6
        "
        overlayClassName="bg-background/35 backdrop-blur-sm"
      >
        <div className="h-[min(88vh,56rem)]">
          {loading ? (
            <div />
          ) : (
            <PracticeDeck practiceItems={practiceItems} emptyState={<div />} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

If your `DialogContent` wrapper does not currently expose `overlayClassName`, then add a reader-specific wrapper or extend the dialog primitive locally.

## 11. Wire It In `ReaderPageClient`

`ReaderPageClient` is the correct owner because it already owns:

- page identity
- session identity
- language selection
- reader interaction state

### Add local state

```ts
const [practiceOpen, setPracticeOpen] = useState(false);
```

### Build page practice items

```ts
const { practiceItems, loading: practiceLoading } = usePagePracticeItems({
  open: practiceOpen,
  session,
  documentId: document?.documentId ?? null,
  documentTitle: document?.title ?? "",
  pageId: currentPage?.id ?? null,
  srcLang: document?.srcLang ?? prefSrcLang ?? "en",
  tgtLang,
  uiLang,
  isSwapped,
});
```

### Close annotation popover when opening practice

```ts
useEffect(() => {
  if (!practiceOpen) return;
  if (!interaction.popoverOpen) return;
  interaction.onPopoverOpenChange(false);
}, [practiceOpen, interaction]);
```

### Suppress arrow-key reader navigation while practicing

Update the arrow-key effect:

```ts
useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (practiceOpen) return;
    if (interaction.popoverOpen) return;

    const isArrow = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key);
    if (!isArrow) return;

    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      if (e.key === "ArrowLeft") onPrevPage();
      if (e.key === "ArrowRight") onNextPage();
      return;
    }

    if (e.key === "ArrowLeft") interaction.revealPrev("sentence");
    if (e.key === "ArrowRight") interaction.revealNext("sentence");
    if (e.key === "ArrowUp") interaction.revealPrev("paragraph");
    if (e.key === "ArrowDown") interaction.revealNext("paragraph");
  };

  window.addEventListener("keydown", onKeyDown, true);
  return () => window.removeEventListener("keydown", onKeyDown, true);
}, [practiceOpen, interaction, onPrevPage, onNextPage]);
```

### Mount the dialog

```tsx
<ReaderPracticeDialog
  open={practiceOpen}
  onOpenChange={setPracticeOpen}
  practiceItems={practiceItems}
  loading={practiceLoading}
/>
```

## 12. Add the Footer Practice Trigger in `ReaderShell`

Update props:

```ts
type ReaderShellProps = {
  // ...
  practiceCount: number;
  onOpenPractice: () => void;
};
```

Add the button where the placeholder currently exists:

```tsx
<div className="inline-flex items-center justify-center">
  <Button
    type="button"
    variant="outline"
    onClick={onOpenPractice}
    className="gap-2"
  >
    <Book className="h-4 w-4" />
    Practice
    {practiceCount > 0 ? <span>{practiceCount}</span> : null}
  </Button>
</div>
```

This keeps the shell presentational and avoids mixing fetch logic into it.

## 13. Recommended Loading Strategy

Do **not** annotate an entire page of words before the dialog opens.

Recommended behavior:

1. User clicks Practice.
2. Dialog opens immediately.
3. Saved page items are loaded first.
4. Top new page candidates are hydrated in background.
5. Deck appears once at least one item exists.

If you want better perceived speed, use a two-phase load:

- first mount deck with saved items
- then append fresh page items as annotation requests return

That requires a small change in `PracticeDeck` so it does not fully reset on every appended item set. If you want that behavior, add an explicit `sessionKey` prop so resets are controlled rather than tied to every array identity change.

## 14. Recommended Deduping Rules

Use the same identity for both saved and unsaved items:

```ts
documentId|pageId|tgtLang|wordId
```

This prevents duplicates between:

- a saved page glossary item
- a fresh unsaved page practice item

Use a `Map` merge where saved items win:

```ts
const deduped = Array.from(
  new Map(
    [...freshPracticeItems, ...savedPracticeItems].map((item) => [
      item.practiceItemId,
      item,
    ])
  ).values()
);
```

If you want saved items to override fresh ones, order them last in the map input.

## 15. Important Refactor Boundary

The biggest implementation risk is duplicating annotate logic in two places:

- `useAnnotatePopover`
- `usePagePracticeItems`

Do not do that.

Instead:

- extract the shared data-building helpers into `documents/feature/lib`
- keep `useAnnotatePopover` focused on popover state and bookmark sync
- let page practice reuse the same builders

That keeps the data model consistent for:

- practice cards
- glossary saves
- glossary info overlay
- reader annotation popover

## 16. Suggested File Additions

Recommended new files:

```text
apps/web/app/(protected)/practice/feature/types/practiceItem.ts
apps/web/app/(protected)/practice/feature/lib/toPracticeItem.ts
apps/web/app/(protected)/documents/feature/lib/practiceItemBuilders.ts
apps/web/app/(protected)/documents/feature/lib/pagePracticeCandidates.ts
apps/web/app/(protected)/documents/feature/hooks/usePagePracticeItems.ts
apps/web/app/(protected)/documents/feature/components/Practice/ReaderPracticeDialog.tsx
```

Recommended edited files:

```text
apps/web/app/(protected)/practice/feature/components/PracticeDeck.tsx
apps/web/app/(protected)/practice/feature/components/cards/DefinitionCard.tsx
apps/web/app/(protected)/practice/feature/components/cards/RecognitionCard.tsx
apps/web/app/(protected)/practice/feature/components/cards/ContextCloze/ContextClozeCard.tsx
apps/web/app/(protected)/practice/feature/components/cards/GlossaryInfoOverlay.tsx
apps/web/app/(protected)/library/feature/components/GlossaryItemCard/GlossaryItemBack.tsx
apps/web/app/(protected)/documents/feature/hooks/useAnnotatePopover.ts
apps/web/app/(protected)/documents/[documentId]/ReaderPageClient.tsx
apps/web/app/(protected)/documents/feature/components/ReaderShell.tsx
```

## 17. Recommended Implementation Order

1. Add `PracticeItem` and conversion helpers.
2. Refactor `PracticeDeck` and cards to consume `PracticeItem`.
3. Extract shared annotate-to-practice builders from `useAnnotatePopover`.
4. Refactor `GlossaryInfoOverlay` / `GlossaryItemBack` away from hard dependency on `LibraryGlossaryItem`.
5. Add candidate selection for unsaved page words.
6. Add `usePagePracticeItems`.
7. Add `ReaderPracticeDialog`.
8. Wire the practice button into `ReaderShell`.
9. Add `practiceOpen` flow to `ReaderPageClient`.
10. Verify interaction conflicts with annotation popover and keyboard nav.

## 18. Manual Verification Checklist

After implementation, verify:

- review page still works with the refactored deck
- saved glossary items still render all three card types
- page practice opens over the reader without layout shift
- annotation popover closes before practice opens
- reader arrow navigation is suppressed while the practice dialog is open
- a page with saved glossary items includes them in practice
- a page with no saved items still produces fresh practice cards
- duplicate saved + fresh items do not appear twice
- glossary info overlay still opens and closes correctly on all card types
- swapped reader mode still builds correct practice item languages and alignment

## 19. Short Version

If you want the shortest description of the recommended approach:

- do not make reader practice depend on `LibraryGlossaryItem`
- define a neutral `PracticeItem`
- reuse the existing annotate pipeline to hydrate unsaved page words
- merge those with saved page glossary items
- feed the merged result into the shared `PracticeDeck`
- keep `ReaderPageClient` as the orchestration boundary

