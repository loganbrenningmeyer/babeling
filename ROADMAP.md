# Babeling Roadmap

Status snapshot based on the current codebase.

## Shipped

### Reading Pipeline

- Paste raw text into the app and create a saved reading document.
- Upload `.txt` files and convert them into saved reading documents.
- Upload `.epub` files and parse them into saved reading documents.
- Split long documents into page-sized chunks for reading.
- Select source and target languages before starting a reading session.
- Swap source and target languages in the upload flow.
- Start a reading session immediately after document creation.
- Translate each page on demand from source to target.
- Preserve paragraph and sentence structure during translation.
- Validate translated paragraph and sentence alignment before using it.
- Compute sentence and word-level alignment for each translated page.
- Cache translated/aligned page sessions client-side by page and language pair.
- Reuse saved page translations from the database instead of recomputing them.
- Deduplicate identical pasted text documents by source-text hash.
- Deduplicate identical uploaded EPUB documents by file hash.

### Reader Experience

- Render a two-pane bilingual reader with source and target text side by side.
- Keep aligned source and target paragraphs on matching rows.
- Highlight aligned tokens across panes on hover.
- Click translated words to open an anchored annotation popover.
- Load dictionary candidates for clicked target words before explanation.
- Show context-aware definitions for clicked words.
- Show grammar and usage explanations for clicked words.
- Show example sentences with source-language tooltips.
- Show surface form, lemma, part of speech, and IPA when available.
- Play pronunciation audio for a word, lemma, sentence, or paragraph.
- Toggle source-text visibility for active reading practice.
- Reveal source text by word, sentence, or paragraph.
- Click source text to toggle visibility using the active blur mode.
- Automatically reveal aligned source tokens when a target token is clicked.
- Navigate source reveal state with arrow keys.
- Navigate reader pages with previous/next controls.
- Navigate reader pages with keyboard shortcuts.
- Show page count and current page in the reader footer.
- Open a table of contents sheet and jump to section starts.
- Show in-product reader help for navigation and interactions.

### Library And Persistence

- Persist documents per authenticated user.
- Persist page translations by document page and language pair.
- Persist reading progress by document and target language.
- Update document recency when users resume reading.
- Resume reading from the latest saved target-language session.
- Show recent documents on the upload page for quick resume.
- Show a saved library of documents for the current user.
- Show library document cards with title, source language, preview text, and recency.
- Flip document cards to show saved translations for that document.
- Show one translation tab per target language on the back of each document card.
- Show translation progress, current page, and last-read time per translation.
- Search library documents and glossary items.
- Filter the library by all items, texts, or glossary items.
- Sort documents by recency, source language, or title.
- Sort glossary items by recency, word, language, or document title.
- Save glossary items directly from the reader annotation popover.
- Prevent duplicate glossary saves for the same word in the same reading context.
- Load all saved glossary items for the current user.
- Show glossary cards with saved word, gloss, language, and source document.
- Expand glossary cards into a larger detail view.
- Show aligned source and target context inside expanded glossary cards.
- Play pronunciation from expanded glossary cards.

### EPUB And Structured Content

- Parse EPUB title, author, language, and section metadata.
- Build a section hierarchy from EPUB structure.
- Save section ranges so the reader can navigate by contents.
- Extract EPUB text into page blocks.
- Ingest EPUB images and cover images into storage.
- Serve saved EPUB images from an authenticated backend route.

### Account, Settings, And App Shell

- Authenticate users with Clerk sign-in and sign-up flows.
- Provision an internal app user record on backend access.
- Load and persist user preferences from the backend.
- Persist preferred source language.
- Persist preferred target language.
- Persist preferred UI language.
- Persist theme preference.
- Hydrate client defaults from saved user preferences.
- Set the app UI language from a global selector in the nav.
- Localize app copy for English, Spanish, French, German, and Italian.
- Show a global app nav with home, upload, library, UI language, and user menu.
- Show a public landing page that markets the product and core workflow.

## Partial

These features exist in the codebase but are not fully productized yet.

- Preferences page route exists, but the page is still a placeholder and does not expose real controls.
- Theme preference is stored, but there is no user-facing theme switcher in the current UI.
- Upload includes an `Import eBook` tab, but the import workflow is still placeholder-only.
- EPUB images are stored and can be fetched, but the current reader UI does not render image blocks.
- The landing page still links to `/translate`, but the active implemented workflow is `/upload`.

## Next

These are the most natural next milestones based on what is already implemented.

### Finish Existing Surfaces

- Build a real preferences screen for language defaults, UI language, and theme.
- Replace the placeholder `Import eBook` tab with a real Gutenberg import flow.
- Update landing-page CTA links to the active upload flow or restore a dedicated `/translate` route.
- Render EPUB image blocks in the reader so illustrated books are fully supported.

### Deepen Reading Workflows

- Add translation switching inside the reader so users can change target language without leaving the document.
- Add explicit loading/progressive states so translation can appear before alignment and annotations finish.
- Add document-level translation coverage views so users can see which pages are already translated.
- Add multi-device session continuity using server-backed reader UI state if needed.

### Expand Study Tools

- Add glossary management actions in the library, including delete/edit from the UI.
- Add richer word study metadata such as tags, notes, mastery state, or spaced-repetition hooks.
- Add source-word click annotation so users can inspect the original side as deeply as the target side.
- Add sentence replay / phrase loop audio controls for listening practice.

### Strengthen Content Ingestion

- Add first-class Gutenberg search and import.
- Add more supported input formats beyond `.txt` and `.epub`.
- Add document metadata editing after import, especially title and author cleanup.
- Add OCR or image-to-text ingestion if scanned content becomes a target use case.

### Platform And Reliability

- Add stronger test coverage for translation, alignment, and reader interaction flows.
- Add explicit error and retry UX for failed translation, alignment, annotation, and pronunciation requests.
- Add instrumentation for latency, cache hit rate, and feature usage.
- Add admin or migration documentation around alignment artifacts, definitions DB, and ingestion pipelines.

## Notes

- This roadmap is intentionally based on implemented code, not just intended product direction.
- `Shipped` means the feature is wired into the current product flow.
- `Partial` means some backend or UI groundwork exists, but the end-to-end experience is not finished.
- `Next` is a recommended build sequence, not a strict commitment.
