# Error Handling Audit

This document summarizes the main user-facing error paths in the current `apps/web` implementation, how they behave today, which files are involved, and the recommended fixes.

Priority is based on:

- how likely the failure is in normal operation (network, auth, backend, malformed responses)
- how badly it affects the user experience when it happens

Status labels:

- `Not graceful`: user gets no useful feedback, misleading feedback, or a hard failure
- `Partial`: the error is surfaced, but the UX is still weak or incomplete
- `Graceful`: the failure is handled in a reasonable way for the current product stage

## Highest Priority Issues

### 1. Page translation persistence failure aborts the reader after successful translation/alignment

- Priority: `Critical`
- Current status: `Not graceful`

Current behavior:

- The reader tries to load a saved page translation first.
- If none exists, it translates the page, aligns it, then saves the result.
- If the save step fails, the whole `usePageSession()` flow throws and the session is discarded.
- This means the user can lose a perfectly valid translation/alignment because persistence failed.

Files involved:

- `apps/web/app/(protected)/documents/feature/hooks/usePageSession.ts`
- `apps/web/app/(protected)/documents/feature/api/pageTranslations.ts`
- `apps/web/app/(protected)/documents/[documentId]/ReaderPageClient.tsx`

Recommended solution:

- Treat `savePageTranslation()` as a non-blocking persistence step.
- Build and render the `ReaderSession` immediately after `translate()` and `align()` succeed.
- Attempt the save in the background; if it fails, log it and optionally surface a small non-blocking warning.
- Keep a retry path for saving later instead of failing the entire page.

### 2. Document creation and import failures are mostly invisible on the upload page

- Priority: `Critical`
- Current status: `Not graceful`

Current behavior:

- `useCreateDocument()` captures and stores creation errors.
- `UploadPage` reads `createError`, but never renders it.
- The outer `onClickTranslate()` catch only logs to the console.
- If upload, auth, or backend parsing fails, the user can click “Start reading” and see no feedback.

Files involved:

- `apps/web/app/(protected)/upload/page.tsx`
- `apps/web/app/(protected)/upload/feature/hooks/useCreateDocument.ts`
- `apps/web/app/(protected)/upload/feature/api/documents.ts`

Recommended solution:

- Render `createError` in the upload page near the primary CTA.
- Add explicit phase-based UI states:
  - downloading eBook
  - uploading document
  - parsing document
  - creating reading session
- Replace console-only failure handling with visible inline errors and a retry action.
- Clear stale errors when the input payload changes or when the user retries.

### 3. File upload uses a brittle direct-to-backend path instead of the safer Next route wrapper

- Priority: `Critical`
- Current status: `Not graceful`

Current behavior:

- Text documents go through `/api/documents`.
- File uploads bypass the app’s server route and post directly to `NEXT_PUBLIC_API_URL`.
- This introduces more failure modes in the browser: missing env, CORS, cross-origin network issues, inconsistent response parsing.
- These failures collapse into the same silent upload failure on the upload page.

Files involved:

- `apps/web/app/(protected)/upload/feature/api/documents.ts`
- `apps/web/app/api/documents/upload/route.ts`

Recommended solution:

- Route file uploads through `/api/documents/upload` just like text creation goes through `/api/documents`.
- Keep token handling and backend URL resolution server-side.
- Normalize response parsing and error shaping in the Next route.
- This will make file and text creation share the same error-handling model.

### 4. Annotation failures produce a blank or near-blank popover

- Priority: `High`
- Current status: `Not graceful`

Current behavior:

- When annotation fails, the error is logged and the define/explain state is set to `null`.
- The popover still opens.
- Once loading finishes, `ReaderShell` renders `AnnotateCard`, but the card mostly renders conditionally on non-null data.
- The end result is a blank-looking popover with no explanation of what failed.

Files involved:

- `apps/web/app/(protected)/documents/feature/hooks/useAnnotatePopover.ts`
- `apps/web/app/(protected)/documents/feature/components/ReaderShell.tsx`
- `apps/web/app/(protected)/documents/feature/components/Annotate/AnnotateCard.tsx`
- `apps/web/app/(protected)/documents/feature/api/annotate.ts`

Recommended solution:

- Add explicit annotation error state in `useAnnotatePopover()`.
- Render an error body inside the popover when annotate fails.
- Include a retry button for the current token.
- Keep cached data if available; only fall back to the error state when no cached annotation exists.

### 5. Glossary bookmark save/delete failures are captured but never shown

- Priority: `High`
- Current status: `Not graceful`

Current behavior:

- Bookmark sync failures set `bookmarkError`.
- The optimistic UI may revert the star state.
- The user gets no visible explanation for why the save or delete failed.

Files involved:

- `apps/web/app/(protected)/documents/feature/hooks/useAnnotatePopover.ts`
- `apps/web/app/(protected)/documents/feature/components/Annotate/AnnotateCard.tsx`

Recommended solution:

- Surface `bookmarkError` in the annotation popover.
- Show a compact inline message near the bookmark button, or use a toast.
- Disable repeated bookmark toggles while sync is in flight.
- Distinguish save vs delete failures in the message text.

### 6. Translation history failures in document cards are misleadingly shown as “No translations yet”

- Priority: `High`
- Current status: `Not graceful`

Current behavior:

- `useRecentTranslations()` stores an error when translation history fails to load.
- `DocumentFlipCard` passes that error into `DocumentBack`.
- `DocumentBack` accepts the prop but does not render it.
- If translations fail to load, the card can fall into the empty state and incorrectly tell the user there are no translations.

Files involved:

- `apps/web/app/(protected)/library/feature/hooks/useRecentTranslations.ts`
- `apps/web/app/(protected)/library/feature/components/DocumentCard/DocumentFlipCard.tsx`
- `apps/web/app/(protected)/library/feature/components/DocumentCard/DocumentBack.tsx`
- `apps/web/app/(protected)/library/feature/api/translations.ts`
- `apps/web/app/api/library/documents/[document_id]/translations/route.ts`

Recommended solution:

- Render `error` explicitly in `DocumentBack`.
- Separate these states:
  - loading
  - failed to load translations
  - no translations exist
- Add a retry control for translation history fetches.

## Medium Priority Issues With Partial Handling

### 7. Reader document/page-session failures are visible but still dead-end the user

- Priority: `High`
- Current status: `Partial`

Current behavior:

- Document load failures and page-session failures are caught and stored.
- `ReaderPageClient` renders a plain red text block and stops.
- The user does see an error, but there is no retry button, reload action, or more structured fallback.

Files involved:

- `apps/web/app/(protected)/documents/feature/hooks/useDocumentLoader.ts`
- `apps/web/app/(protected)/documents/feature/hooks/usePageSession.ts`
- `apps/web/app/(protected)/documents/[documentId]/ReaderPageClient.tsx`
- `apps/web/app/(protected)/documents/feature/api/documents.ts`

Recommended solution:

- Replace the plain text error blocks with a dedicated reader error state component.
- Provide:
  - a retry button
  - a link back to the library/upload screen
  - clearer messaging for document load vs translation/alignment failure
- Preserve layout chrome where possible so the page does not fully collapse.

### 8. Translation and alignment failures are reduced to generic error strings

- Priority: `High`
- Current status: `Partial`

Current behavior:

- The frontend wrappers throw `"Translate failed"` and `"Align failed"` for all non-OK responses.
- Any useful backend error detail is discarded before it reaches the UI.
- The reader can only display generic failures.

Files involved:

- `apps/web/app/(protected)/documents/feature/api/translate.ts`
- `apps/web/app/(protected)/documents/feature/api/align.ts`
- `apps/web/app/(protected)/documents/feature/hooks/usePageSession.ts`

Recommended solution:

- Parse response bodies for structured errors or text.
- Preserve backend-provided error detail where safe.
- Wrap failures in more descriptive messages, for example:
  - translation service unavailable
  - alignment service unavailable
  - invalid translation payload returned

### 9. Several Next route wrappers can fail hard on bad upstream responses

- Priority: `High`
- Current status: `Partial`

Current behavior:

- Some route handlers call the backend directly and immediately `await res.json()`.
- If the backend is unreachable, returns non-JSON, or the env is missing, these routes can throw instead of returning a controlled error payload.
- This is especially true for translation, alignment, and annotation routes.

Files involved:

- `apps/web/app/api/translate/route.ts`
- `apps/web/app/api/align/route.ts`
- `apps/web/app/api/annotate/route.ts`
- `apps/web/app/api/documents/route.ts`
- `apps/web/app/api/documents/upload/route.ts`
- `apps/web/app/api/page_translations/route.ts`

Recommended solution:

- Standardize these routes on the safer pattern already used in some other routes:
  - validate env before fetch
  - wrap upstream fetch in `try/catch`
  - read `res.text()` first
  - attempt JSON parse, but gracefully fall back to text
  - return a normalized `{ error }` response on failure
- Reuse shared helpers from `apps/web/lib/server-api.ts` where possible.

### 10. Pronunciation failures are tracked internally but invisible to users

- Priority: `Medium`
- Current status: `Partial`

Current behavior:

- `usePronunciation()` stores an `error`.
- `PronounceButton` ignores that error state completely.
- If pronunciation fails, users often see no response except the button stopping.

Files involved:

- `apps/web/app/hooks/usePronunciation.ts`
- `apps/web/app/(protected)/documents/feature/components/Pronounce/PronounceButton.tsx`
- `apps/web/app/api/pronounce/route.ts`

Recommended solution:

- Surface pronunciation failures with a tooltip, inline message, or toast.
- Consider adding a disabled/loading state that visibly distinguishes:
  - loading
  - playing
  - failed
- Handle `audio.onerror` by updating state, not just logging to the console.

### 11. eBook download errors are validated correctly, but still disappear at the primary CTA

- Priority: `Medium`
- Current status: `Partial`

Current behavior:

- The Gutendex download route returns specific errors for invalid URLs and failed upstream downloads.
- `fetchSelectedGutenbergFile()` preserves those messages.
- But the surrounding upload flow still only logs the final failure.

Files involved:

- `apps/web/app/api/gutendex/download/route.ts`
- `apps/web/app/(protected)/upload/page.tsx`

Recommended solution:

- Feed download errors into the same visible upload error area as document creation errors.
- Differentiate “download failed” from “document creation failed” so the user knows which step broke.

## Lower Priority Issues That Are Currently Handled Reasonably

### 12. Missing saved page translations are treated as a valid cache miss

- Priority: `Medium`
- Current status: `Graceful`

Current behavior:

- A `404` on page-translation lookup returns `null`.
- The reader correctly treats that as “no saved translation yet” and creates one.

Files involved:

- `apps/web/app/(protected)/documents/feature/api/pageTranslations.ts`

Recommended solution:

- Keep this behavior.
- Optionally document it more explicitly so future refactors do not convert this into a fatal error.

### 13. Top-level library fetch failures are visible to the user

- Priority: `Medium`
- Current status: `Graceful`

Current behavior:

- The library page shows a blocking error if user info, recent documents, or recent glossary items fail to load.
- The messaging is basic, but the state is visible and not misleading.

Files involved:

- `apps/web/app/(protected)/library/page.tsx`
- `apps/web/app/(protected)/library/feature/hooks/useRecentDocuments.ts`
- `apps/web/app/(protected)/library/feature/hooks/useRecentGlossaryItems.ts`

Recommended solution:

- Keep the visible error handling.
- Improve it by adding retry buttons and separating auth failures from data-load failures.

### 14. Recent documents on the upload page have a proper error state

- Priority: `Low`
- Current status: `Graceful`

Current behavior:

- The upload page’s recent-documents panel has:
  - loading skeleton
  - styled error state
  - empty state

Files involved:

- `apps/web/app/(protected)/upload/feature/components/RecentDocumentsPanel.tsx`
- `apps/web/app/(protected)/library/feature/hooks/useRecentDocuments.ts`

Recommended solution:

- This is a good pattern to reuse in the rest of the app.
- Consider standardizing this style for other user-visible fetch failures.

### 15. Gutendex search errors are surfaced clearly in the import panel

- Priority: `Low`
- Current status: `Graceful`

Current behavior:

- Search failures render a visible styled error message inside the import panel.
- The user is not left guessing.

Files involved:

- `apps/web/app/(protected)/upload/feature/hooks/useGutendexBooks.ts`
- `apps/web/app/(protected)/upload/feature/components/ImportEbook/ImportEbookPanel.tsx`
- `apps/web/app/api/gutendex/books/route.ts`

Recommended solution:

- Keep this pattern.
- Reuse the same error presentation in the upload CTA path.

### 16. Read-progress persistence is intentionally non-blocking

- Priority: `Low`
- Current status: `Graceful`

Current behavior:

- Read progress saves in the background.
- Failures are logged but do not interrupt reading.
- The route also tolerates non-JSON upstream responses and normalizes them.

Files involved:

- `apps/web/app/(protected)/documents/[documentId]/ReaderPageClient.tsx`
- `apps/web/app/(protected)/documents/feature/api/readProgress.ts`
- `apps/web/app/api/read_progress/route.ts`

Recommended solution:

- Keep this non-blocking behavior.
- Optionally add lightweight retry/backoff or silent telemetry, but do not block the reader.

### 17. User preferences fall back safely, but failures are silent

- Priority: `Low`
- Current status: `Graceful`

Current behavior:

- Initial preference fetch failures keep local defaults.
- Preference writes are optimistic and fire-and-forget.
- The user is not blocked, but they also are not told if persistence failed.

Files involved:

- `apps/web/components/UserPreferencesProvider.tsx`
- `apps/web/app/api/user_preferences/route.ts`

Recommended solution:

- Keep the fallback-to-defaults behavior.
- Add optional non-blocking feedback when saving preferences fails.
- If preferences are product-important later, introduce retry and rollback behavior for failed writes.

## Recommended Implementation Order

1. Fix reader session construction so translation/alignment success is not lost when saving the page translation fails.
2. Add visible upload/import error handling for document creation, eBook download, and file upload.
3. Add explicit annotation and bookmark error states in the popover.
4. Fix translation-history error handling in library document cards.
5. Standardize Next route wrappers so they always return normalized error payloads.
6. Improve the reader’s blocking error states with retry and recovery actions.
7. Add visible pronunciation failure feedback.

## Cross-Cutting Recommendations

### Normalize error payloads

Create a shared frontend/server convention for route errors:

- `status`
- `error`
- optional `code`
- optional `details`

This avoids generic `"failed"` messages and makes it easier to render good UI.

### Separate blocking vs non-blocking failures

Use a clear rule:

- Blocking failures: document load, translation, alignment
- Non-blocking failures: save page translation, save read progress, save preferences

Blocking failures should stop the flow with a recoverable UI.
Non-blocking failures should preserve user progress and surface only lightweight warnings.

### Prefer reusable error UI primitives

Add a small set of shared components:

- inline error banner
- retry panel
- non-blocking warning/toast

That will make the app feel consistent and prevent each feature from inventing a different error pattern.
