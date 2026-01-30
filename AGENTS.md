# AGENTS.md (Codex)

This repo is **Babeling**: a bilingual reading + translation web app with **sentence + word alignment**, **inline dictionary/grammar explanations**, and **pronunciation**. The codebase is a small monorepo:

- **Frontend**: Next.js App Router (`apps/web`) + shadcn/ui + Tailwind
- **Backend**: Python API service (`services/api`) that calls into a shared NLP package (`packages/babeling-nlp`)
- **Artifacts**: pretrained alignment checkpoints in `artifacts/binaryalign/`

Use this file as the “mental model” + conventions to follow when making changes.

---

## What Babeling does (high-level UX)

The core experience is a two-pane reader:

- user provides text (paste / upload)
- app can **split into pages**, then per page:
  1) translate source → target
  2) align source ↔ target at sentence/word level (BinaryAlign-style)
  3) allow hover/click on tokens to:
     - show dictionary/definition candidates
     - show LLM explanation cards (grammar, usage, examples)
     - optionally blur/unblur at word/sentence/paragraph granularity
  4) play pronunciation audio for selected text/word

The UI is built around “words + spaces arrays” and stable IDs so alignment overlays are deterministic.

---

## Repo map

### Frontend (Next.js)
`apps/web/`

Key areas:

- `app/page.tsx` / `app/translate/page.tsx`
  - main screens / orchestrate calls to API routes
  - maintains session state (sourceText, targetText, token arrays, ids, etc.)

- `app/api/*/route.ts` (Next server routes / BFF)
  - **thin wrappers** that call the Python service
  - expected to do: input validation, forwarding, minimal shaping
  - not expected to do: heavy NLP logic

- `app/components/*`
  - UI building blocks for the reader
  - important components:
    - `TextSurface.tsx`: renders bilingual panes + alignment overlays
    - `HoverText/HoverText.tsx`: token rendering, hover reveal, blur logic
    - `AnchoredPopover.tsx`: token-anchored popover positioning
    - `DefineCard.tsx` / `ExplainCard.tsx`: dictionary + LLM explanation display
    - `BlurModeToggle.tsx`: word/sentence/paragraph modes
    - `UploadSurface.tsx` / `Dropzone.tsx`: file ingestion

- `app/hooks/usePronunciation.ts`
  - client hook for pronunciation requests + audio playback

- `components/ui/*`
  - shadcn/ui primitives (don’t hand-edit unless you know what you’re doing)

### Python API service
`services/api/`

- `src/api/main.py`
  - Python web server entry (FastAPI-style service)
  - exposes endpoints for translate / explain / define / align / etc.

- `src/api/prompts/*.txt`
  - system prompts used by the LLM-backed features
  - these are “product-critical”: small changes can affect UX a lot

- `src/api/utils.py`
  - shared helpers (request shaping, env/config, etc.)

### Shared NLP package (library used by the service)
`packages/babeling-nlp/src/babeling_nlp/`

- `segmenter.py`: splitting text into sentences/pages (and/or chunking)
- `gemini.py`: LLM client wrapper (translation/explanation)
- `align.py`: alignment logic + checkpoint usage
- `define.py`: dictionary candidate selection
- `wiktionary.py`: Wiktionary parsing / candidate retrieval

### Artifacts
`artifacts/binaryalign/`
- pretrained checkpoints used by alignment
- treat as read-only; don’t rename paths casually

---

## Data model conventions (frontend)

Babeling heavily relies on **stable tokenization**:

- Token arrays: `words: string[]` and `spaces: string[]`
  - `spaces[i]` is the whitespace *after* `words[i]` (common pattern)
- IDs:
  - `sentIds: number[]` per token
  - (often) paragraph IDs / mappings
- Alignment data is generally expressed as:
  - source token index ↔ target token indices (and/or score weights)
  - sentence-alignment boundaries used to restrict word alignment search

When implementing new features:
- preserve stable indexes whenever possible
- avoid re-tokenizing on the client in a way that shifts indices after alignment is computed
- prefer adding new derived arrays (e.g., `isBlurred`, `isRevealed`) over mutating `words/spaces`

---

## API architecture (how requests flow)

Typical flow:

Client components →
Next route (`apps/web/app/api/<feature>/route.ts`) →
Python service (`services/api`) →
NLP package (`packages/babeling-nlp`)

Guidelines:
- Next route handlers should be “boring”: validate, forward, return.
- NLP logic belongs in Python (service or package), not in Next.
- Keep request/response payloads explicit and typed on the TS side.

Current Next route entrypoints:
- `app/api/translate/route.ts`
- `app/api/align/route.ts`
- `app/api/define_and_explain/route.ts`
- `app/api/pronounce/route.ts`
- `app/api/split_pages/route.ts`

---

## What to be careful about

### 1) Alignment + UI coupling
Small changes to tokenization or segmentation can break:
- hover highlighting
- popover anchoring
- alignment overlays
- blur mode reveal logic

If you touch any of:
- `HoverText/*`
- `clusterText.ts`
- the structure of session state
- server output shapes for alignment

…expect to update multiple pieces and verify end-to-end.

### 2) Prompt changes are product changes
`services/api/src/api/prompts/*.txt` directly affects:
- translation naturalness
- explanation “teacher voice”
- dictionary gloss selection behavior
- alignment-related heuristics if the LLM is involved

Make prompt edits deliberately, and keep them minimal and testable.

### 3) Safari quirks / rendering performance
The reader is DOM-heavy (many spans). Favor:
- minimal re-renders (memoize token rows where possible)
- CSS effects that don’t trigger expensive repaints
- avoiding heavy blur filters on large text blocks

### 4) Latency and perceived speed
The UX is best when:
- translation can display quickly
- alignment/explanations can “fill in” afterward

Prefer progressive UI updates: show partial results (e.g., translated text) while alignment loads.

---

## How to add a new feature (recommended pattern)

1) Define the API contract first:
   - request/response JSON shape
   - which service is responsible (Next wrapper vs Python service)

2) Implement in Python package/service:
   - keep it testable in isolation
   - avoid mixing parsing + model calls + formatting all in one function

3) Add a Next route wrapper:
   - minimal validation (zod optional)
   - pass-through errors with useful messages

4) Implement UI with careful state updates:
   - do not disrupt token indices
   - keep long text rendering efficient

---

## Local dev assumptions (what Codex should assume)

- This is a monorepo; frontend and backend are separate packages.
- The Next app is under `apps/web`.
- The Python service is under `services/api`.
- The NLP library is under `packages/babeling-nlp` and is imported by the service.
- Alignment checkpoints exist under `artifacts/binaryalign`.

If you need to reference environment variables, prefer documenting them rather than hardcoding:
- LLM provider keys (Gemini)
- Python service base URL for Next routes
- model/checkpoint paths

---

## Coding style expectations

### TypeScript / React
- Prefer small components with explicit props.
- Keep state minimal; derive UI state when possible.
- Avoid introducing new global state libraries unless clearly necessary.
- Use shadcn/ui primitives rather than custom re-implementations.

### Python
- Keep the NLP package (`packages/babeling-nlp`) free of web-framework concerns.
- Keep `services/api` responsible for HTTP, auth (future), request parsing, and wiring.
- Functions should return plain dicts / dataclasses that can be JSON-serialized.

---

## Testing / verification checklist (manual)

When making changes that touch translation/alignment/hover UI, verify:

- paste short text → translate → alignment overlays appear
- hover token shows popover correctly anchored
- blur mode toggle works (word/sentence/paragraph)
- definition + explanation card renders and scrolls correctly
- pronunciation button plays audio (and doesn’t block UI)
- multi-page splitting doesn’t shift indices across pages

---

## “Do not do” list

- Don’t re-tokenize already-aligned text on the client without updating alignment mappings.
- Don’t move or rename checkpoint artifacts without updating the Python code that loads them.
- Don’t put alignment logic in Next route handlers.
- Don’t make prompt files huge; keep them focused and deterministic.

---

## Where to start when debugging

- UI hover/blur bugs: `apps/web/app/components/HoverText/HoverText.tsx`
- Alignment rendering: `apps/web/app/components/TextSurface.tsx`
- Popover positioning: `apps/web/app/components/AnchoredPopover.tsx`
- Next route issues: `apps/web/app/api/*/route.ts`
- Python API wiring: `services/api/src/api/main.py`
- Core NLP behavior: `packages/babeling-nlp/src/babeling_nlp/*`

---

## Context: “BinaryAlign” artifacts

`artifacts/binaryalign/*` contains alignment checkpoints used by `babeling_nlp.align`.
Treat these as immutable binary assets; any change should be accompanied by:
- an explicit version bump or naming convention
- updated loader paths
- a note in relevant README / docs
