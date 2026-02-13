# Babeling Architecture and Feature Breakdown

This document explains how Babeling works end-to-end, including UI composition, API flows, backend wiring, NLP internals, and data contracts.

## 1) Monorepo Structure

- `apps/web`: Next.js App Router frontend + BFF API route wrappers.
- `services/api`: FastAPI service exposing translation/alignment/definition/pronunciation/splitting endpoints.
- `packages/babeling-nlp`: shared NLP package used by the FastAPI service.
- `packages/binaryalign`: alignment model/inference package used by `babeling-nlp.align`.
- `artifacts/binaryalign`: BinaryAlign checkpoints (read-only model artifacts).

## 2) Runtime Boundaries

- Browser/UI logic runs in `apps/web/app/translate/page.tsx` and child components.
- Browser calls Next route handlers under `apps/web/app/api/*/route.ts`.
- Next route handlers proxy to Python API using `process.env.NEXT_PUBLIC_API_URL`.
- FastAPI in `services/api/src/api/main.py` calls into `babeling_nlp` modules.
- Alignment can run:
  - locally in FastAPI process via `Aligner`, or
  - remotely via Modal when `MODAL_ALIGN_URL` is set.

## 3) Primary End-to-End User Flows

### 3.1 Start Reading Session (paste/upload -> pages)

1. User enters text or uploads file in `Translate` page.
2. `startReadingSession()` reads full text from `sourceFile.text()` or `sourceText`.
3. Frontend POSTs to `/api/split_pages`.
4. Next route `apps/web/app/api/split_pages/route.ts` forwards to Python `/split_pages`.
5. FastAPI `split_pages()` calls `default_segmenter.split_pages(text)` and returns `{pages}`.
6. Frontend resets session state, clears page cache, and loads first page via `loadPageSession(0)`.

### 3.2 Load Page Session (translate -> align -> render)

1. `loadPageSession(pid)` checks `pageCache`.
2. If cached, restore `session` + blur/navigation state.
3. If not cached, call `translateAndAlign(pageText)`.
4. `translateAndAlign`:
  - POST `/api/translate` with `{source, src_lang, tgt_lang}`.
  - POST `/api/align` with normalized `source` and translated `target`.
5. Build `Session` object from alignment response and initialize all source words as blurred.
6. Render with `ParagraphGrid` + `HoverText` in a two-column aligned layout.

### 3.3 Hover and Alignment Highlighting

- Hover source word:
  - `handleSourceHover(idx)` sets `hoveredSourceIndex`.
  - Highlight targets via `session.align.srcToTgt[idx]`.
- Hover target word:
  - `handleTargetHover(idx)` sets `hoveredTargetIndex`.
  - Highlight aligned source indices via `session.align.tgtToSrc[idx]`.
- `ParagraphGrid` passes highlight arrays into each `HoverText`.

### 3.4 Target Word Click (definition + explanation popover)

1. User clicks target token in `HoverText` -> `onTargetWordClick`.
2. `handleTargetWordClick(i, el)` in `translate/page.tsx`:
  - locks target interaction,
  - stores clicked anchor element,
  - optionally reveals aligned source words if source blur is enabled,
  - opens popover anchored to clicked token.
3. Frontend POSTs `/api/define_and_explain` with:
  - token arrays, spaces arrays,
  - sentence/paragraph ids,
  - `tgt_to_src` alignment map,
  - clicked target index.
4. FastAPI `/define_and_explain`:
  - gets dictionary candidates with `get_definition_candidates`,
  - calls `GeminiAPI.define_and_explain(...)`.
5. Response fills:
  - `DefineCard` (lemma, POS, gloss, IPA),
  - `ExplainCard` (markdown explanation + examples).

### 3.5 Pronunciation

1. Any `PronounceButton` calls `usePronunciation().play(text, tgtLang)`.
2. Hook POSTs `/api/pronounce`.
3. Next route forwards to Python `/pronounce`.
4. FastAPI calls Inworld TTS API, decodes base64 WAV, returns `audio/wav`.
5. Hook creates object URL + `Audio`, manages loading/playing state, and cleanup.

### 3.6 Page and Reveal Navigation

- Page navigation:
  - Buttons or `Ctrl/Cmd + Left/Right` call `goPrevPage/goNextPage`.
  - Current page `session.state` is cached before switching.
- Source reveal navigation:
  - `Arrow Left/Right`: hide/reveal sentence.
  - `Arrow Up/Down`: hide/reveal paragraph.
  - Logic in `useSourceRevealNav` modifies `blurredSource` set by sentence/paragraph mappings.

## 4) Frontend Architecture (apps/web)

### 4.1 Global App Shell

- `app/layout.tsx`:
  - loads fonts (`Charter` for reading, `Manrope` for UI),
  - wraps app in `ClerkProvider`,
  - renders sticky nav and main content container.
- `app/page.tsx`:
  - static landing page with feature overview.
- `app/sign-in/...` and `app/sign-up/...`:
  - Clerk-hosted auth screens.

### 4.2 Translate Screen: Orchestrator

File: `apps/web/app/translate/page.tsx`

Main responsibilities:

- input acquisition (textarea + file upload + sample loader),
- language selection and swapping,
- page segmentation and per-page session caching,
- translation/alignment API calls,
- highlight/hover/click interaction state,
- blur mode + reveal navigation state,
- popover and explanation lifecycle,
- keyboard shortcuts for reveal/page navigation.

### 4.3 Session Data Model (client)

`Session` contains:

- `sourceText`, `targetText`.
- `src`:
  - `words`, `spaces`,
  - `sentIds`,
  - `sentToParIds`,
  - `sentToWordIds`,
  - `parIds`,
  - `parToSentIds`,
  - `parToWordIds`.
- `tgt`:
  - `words`, `spaces`,
  - `sentIds`, `parIds`.
- `align`:
  - `srcToTgt`, `tgtToSrc`.
- `state`:
  - `blurredSource` (set of blurred source token indices),
  - `navSentId`, `navParId`.

This model is the key bridge between backend alignment output and UI behavior.

### 4.4 Reader Composition

- `ParagraphGrid.tsx`:
  - groups rendering by source paragraph ids,
  - builds target paragraph mapping from target sentence id -> source paragraph id,
  - slices per-paragraph word/space windows while preserving global index offsets.
- `HoverText.tsx`:
  - renders token clusters, hover highlights, click handlers,
  - source mode supports blur toggling at word/sentence/paragraph granularity.
- `HoverText/clusterText.ts`:
  - merges punctuation/clitics into display clusters for natural rendering,
  - preserves one anchor index per cluster for deterministic mapping.
- `AnchoredPopover.tsx`:
  - uses clicked element `getBoundingClientRect()`,
  - creates fixed-position Radix anchor for stable popover placement during scroll/resize.
- `DefineCard.tsx` + `ExplainCard.tsx`:
  - definition card uses IPA + POS + gloss + pronunciation buttons,
  - explanation card renders markdown explanation and example tooltips.

### 4.5 Blur and Navigation Controls

- `SourceBlurButton.tsx`: enable/disable source blur mode.
- `BlurModeToggle.tsx`: choose `word | sentence | paragraph`.
- `useSourceRevealNav.ts`:
  - computes reveal/hide operations using sentence/paragraph -> word index maps,
  - powers keyboard-based progressive reveal.

### 4.6 Input Components

- `AppTextarea.tsx`: styled text input surface.
- `UploadSurface.tsx` + `Dropzone.tsx`:
  - accepts `.pdf`, `.epub`, `.txt`,
  - currently reads selected file as text on the client when starting a session.
- `sampleTexts.ts`:
  - local sample registry; files loaded from `public/texts/<lang>/<filename>`.

### 4.7 Pronunciation UI

- `hooks/usePronunciation.ts`:
  - lifecycle-safe audio playback and cleanup.
- `components/Pronounce/PronounceButton.tsx`:
  - toggles play/stop and shows active audio icon animation.
- CSS animation classes in `app/globals.css`: dots/equalizer/volume-cycle effects.

## 5) Next.js BFF API Routes (apps/web/app/api)

All routes are thin forwarders to Python service.

### 5.1 `/api/translate`

- Input: `{ source, src_lang, tgt_lang }`
- Forwards to: `POST {API_BASE_URL}/translate`
- Output: `{ source, target }`

### 5.2 `/api/align`

- Input: `{ source, target, src_lang, tgt_lang }`
- Forwards to: `POST {API_BASE_URL}/align`
- Output includes:
  - token arrays,
  - spacing arrays,
  - sentence/paragraph ids/maps,
  - `src_to_tgt` + `tgt_to_src`.

### 5.3 `/api/define_and_explain`

- Input: aligned token/context payload + `tgt_idx`.
- Forwards to: `POST {API_BASE_URL}/define_and_explain`.
- Output: word/lemma/POS/gloss/IPA + explanation/examples.

### 5.4 `/api/pronounce`

- Input: `{ text, tgt_lang }`.
- Forwards to Python `/pronounce`.
- Returns WAV bytes with `Content-Type: audio/wav` and `Cache-Control: no-store`.

### 5.5 `/api/split_pages`

- Input: `{ text }`.
- Forwards to Python `/split_pages`.
- Output: `{ pages }`.

## 6) Python API Service (services/api/src/api/main.py)

### 6.1 Startup and Caching

- Reads env config:
  - `BINARYALIGN_CKPT_PATH`
  - `MODAL_ALIGN_URL` or `MODAL_ALIGN_DIR`
  - `BABELING_PROMPTS_DIR`
  - `INWORLD_RUNTIME_BASE64_CREDENTIAL`
- Creates:
  - `aligner` (local BinaryAlign wrapper) unless Modal URL is configured,
  - `default_segmenter` for page splitting,
  - lazy caches:
    - `_segmenters[(src_lang, tgt_lang)]`
    - `_gemini[(src_lang, tgt_lang)]`.

### 6.2 Endpoint Behavior

#### `POST /translate`

- `mark_linebreaks()` replaces line breaks with `<LB>` markers before LLM call.
- `GeminiAPI.translate()` runs prompt-constrained translation.
- `remove_linebreaks()` restores line breaks.
- Returns normalized source + translated target.

#### `POST /align`

- If `MODAL_ALIGN_URL` is set: proxy request to Modal endpoint.
- Else:
  - `Segmenter.split_par_sent_words(source/tgt)` -> nested par/sent/word arrays,
  - `Aligner.align(...)` -> global words, alignments, sentence/paragraph id maps,
  - `get_token_spaces(original_text, words)` for source and target spacing arrays.
- Returns full alignment payload consumed by frontend `Session`.

#### `POST /define_and_explain`

- Looks up candidate dictionary entries via `get_definition_candidates(tgt_word, tgt_lang)`.
- Calls `GeminiAPI.define_and_explain(...)` with candidates + full aligned context.
- Returns final lexical + pedagogical explanation payload.

#### `POST /pronounce`

- Maps target language to voice id.
- Calls Inworld TTS endpoint with low temperature.
- Decodes `audioContent` base64 and returns WAV bytes.

#### `POST /split_pages`

- Uses `default_segmenter.split_pages(text, max_chars=2500 default)`.
- `default_segmenter` is initialized once with `DEFAULT_SRC_LANG="en"` and `DEFAULT_TGT_LANG="fr"` in `main.py`.

### 6.3 Extra DB Endpoints

- `/users`, `/delete-user`, `/delete-users-table` exist for SQLAlchemy test/demo CRUD.
- Separate DB module also exists under `services/api/src/api/database/*`.
- These are not part of the main translation/alignment UX path.

## 7) NLP Package Internals (packages/babeling-nlp)

### 7.1 `segmenter.py`

`Segmenter(src_lang, tgt_lang)` loads spaCy language models and exposes:

- `split_words(text, lang)`: tokenization.
- `split_sents(text, lang)`: spaCy sentence splitting.
- `split_sents_punct(text)`: custom punctuation-aware splitter with safeguards:
  - ellipsis normalization,
  - abbreviation protection,
  - decimal/version dot protection,
  - quote/paren post-pass merge.
- `split_pars(text)`: split on blank lines.
- `split_par_sents(text)`: paragraphs -> sentence lists.
- `split_par_sent_words(text, lang)`: paragraphs -> sentences -> words.
- `split_pages(text, max_chars=2500)`:
  - normalizes/de-wraps text,
  - accumulates sentence content into page strings with paragraph breaks.

### 7.2 `align.py`

- `Aligner` loads:
  - tokenizer (`BinaryAlignTokenizer`),
  - backbone + classifier + checkpoint,
  - `BinaryAlign` inference wrapper.
- `align(...)` delegates to `BinaryAlign.align_document_pair(...)`.

### 7.3 `gemini.py`

- `GeminiAPI.translate(source)`:
  - uses `gemini-3-flash-preview` with system prompt from `translate.txt`.
- `GeminiAPI.define_and_explain(...)`:
  - reconstructs clicked target sentence and paragraph from ids/maps,
  - marks aligned source span and clicked target word using `<SOURCE>/<TARGET>` tags,
  - includes dictionary candidates JSON in prompt,
  - requests strict JSON output with schema (`ExplainDefineOut`),
  - then overrides IPA with DB-derived values when available.

Helper functions:

- `mark_words`: injects XML-like markers on selected token indices.
- `build_text`: reconstructs full sentence/paragraph text from `(words, spaces, ids)`.

### 7.4 `define.py`

- Reads dictionary DB from `DEFINITIONS_DB_PATH` (SQLite).
- `get_definition_candidates(word, lang)`:
  - resolves possible lemmas via `dict_forms`,
  - fetches lemma entries from `dict_entries`,
  - returns lemma/POS/gloss candidates for LLM disambiguation.
- IPA helpers:
  - `get_lemma_ipa(lemma, pos, lang)`
  - `get_form_ipa(form, lang, lemma?, pos?)`
  - fallback validation via `is_valid_ipa`.

### 7.5 `wiktionary.py`

Offline dictionary ingestion/build utilities:

- initializes SQLite schema,
- parses Wiktionary JSONL GZ extracts,
- stores:
  - lemma entries (`dict_entries`),
  - form-to-lemma mappings (`dict_forms`),
  - optional form IPA/POS rows (`dict_form_entries`).

This supports runtime candidate lookup and IPA retrieval in `define.py`.

## 8) BinaryAlign Inference Contract (packages/binaryalign)

`binaryalign/inference/align.py` behavior:

- `align_document_pair(src_par_sent_words, tgt_par_sent_words)` iterates paragraph and sentence pairs.
- For each sentence pair:
  - aligns source words against target words using marked-source batching,
  - aggregates token-level predictions into word-level mappings.
- Emits:
  - global source/target token arrays,
  - `src_alignments` and `tgt_alignments`,
  - sentence/paragraph id arrays and reverse maps used by frontend blur/navigation.

Important implementation detail:

- Paragraph and sentence loops use `zip(...)`, so they assume translated structure remains sentence-aligned with source. The strict translation prompt is designed to preserve this invariant.

## 9) Prompt Architecture

- `services/api/prompts/translate.txt`:
  - enforces exact sentence count/order and `<LB>` preservation.
  - prioritizes alignment constraints over fluency.
- `services/api/prompts/explain.txt`:
  - enforces strict JSON schema keys.
  - constrains sense selection to provided dictionary candidates.
  - requires user-facing explanation text and examples.

Prompt files are product-critical and directly affect output shape/quality.

## 10) Environment Variables and External Dependencies

### 10.1 Frontend

- `NEXT_PUBLIC_API_URL`: Python API base for Next route forwarding.

### 10.2 API Service / NLP

- `BINARYALIGN_CKPT_PATH`: local checkpoint path.
- `MODAL_ALIGN_URL` or `MODAL_ALIGN_DIR`: optional remote alignment endpoint.
- `BABELING_PROMPTS_DIR`: directory containing `translate.txt` and `explain.txt`.
- `GEMINI_API_KEY`: Gemini client auth.
- `INWORLD_RUNTIME_BASE64_CREDENTIAL`: Inworld TTS auth.
- `DEFINITIONS_DB_PATH`: SQLite dictionary DB path.
- `DEFINITIONS_DB_URL`: optional startup download URL used by `entrypoint.sh`.
- `DATABASE_URL`: SQLAlchemy DB URL for user CRUD endpoints.

### 10.3 Model/Artifact Dependencies

- spaCy small models for `en/fr/es/it/de`.
- Transformer backbone `microsoft/mdeberta-v3-base`.
- BinaryAlign checkpoint loaded from artifact path.

## 11) Configuration and Styling

- Tailwind config extends two font families:
  - `font-reading`: Charter local font variable.
  - `font-ui`: Manrope variable.
- shadcn/ui configured with neutral base in `components.json`.
- `globals.css` contains:
  - custom scrollbar utilities,
  - pronunciation icon animations,
  - CSS variables and theme tokens.

## 12) Sequence Map (Condensed)

### Translate + Align

`Translate page` -> `POST /api/translate` -> `FastAPI /translate` -> `GeminiAPI.translate`
-> `POST /api/align` -> `FastAPI /align` -> `Segmenter.split_par_sent_words`
-> `Aligner.align` -> `BinaryAlign.align_document_pair` -> `Session` build -> UI render

### Define + Explain

`Target word click` -> `POST /api/define_and_explain`
-> `FastAPI /define_and_explain` -> `get_definition_candidates`
-> `GeminiAPI.define_and_explain` -> `DefineCard + ExplainCard`

### Pronounce

`PronounceButton` -> `usePronunciation.play` -> `POST /api/pronounce`
-> `FastAPI /pronounce` -> `Inworld TTS` -> WAV bytes -> browser audio playback

## 13) High-Coupling Areas (Most Important to Preserve)

- Token and spacing arrays (`words[]`, `spaces[]`) must remain index-stable.
- Sentence/paragraph id maps power:
  - alignment highlights,
  - blur toggling,
  - keyboard reveal navigation,
  - paragraph-grid slicing.
- Translation prompt constraints are foundational for BinaryAlign sentence pairing assumptions.
- Any schema drift in `/align` or `/define_and_explain` immediately affects frontend behavior.

## 14) Local Development Entrypoints

- Web app scripts (`apps/web/package.json`):
  - `npm run dev:web`: Next.js dev server.
  - `npm run dev:api`: uvicorn for FastAPI.
  - `npm run dev`: runs both with `concurrently`.
- API Docker boot:
  - installs packages and spaCy models,
  - optional dictionary DB download in `services/api/scripts/entrypoint.sh`,
  - starts uvicorn on port `8000`.
