# Babeling Refactor Plan

This document outlines the key places to refactor in this repository and concrete recommendations for how to do it in a maintainable, standard way for future development.

## Goals

- Reduce single-file complexity in frontend and backend orchestration layers.
- Standardize API boundaries and request flow.
- Improve reliability (error handling, resource management, schema management).
- Make future feature work easier by clarifying ownership between UI, BFF, API, and NLP layers.

## Priority Overview

- P0: High-impact structure and reliability issues that will slow future work if not addressed now.
- P1: Important standardization and maintainability improvements.
- P2: Cleanup and developer-experience improvements.

---

## P0 Refactors

### 1) Split monolithic translate page orchestration

- Current hotspot:
  - `apps/web/app/(protected)/translate/page.tsx`
- Problem:
  - This file currently owns too many concerns: UI composition, state orchestration, page/session caching, network requests, keyboard navigation, popover lifecycle, and interaction logic.
  - This increases bug risk and makes future features hard to implement safely.

#### Recommendation

Break into focused hooks and components:

- Hooks:
  - `apps/web/app/(protected)/translate/hooks/useReadingSession.ts`
    - Owns split-pages + translate + align request flow and session creation.
  - `apps/web/app/(protected)/translate/hooks/usePageCache.ts`
    - Owns per-page session cache + persistence of page UI state.
  - `apps/web/app/(protected)/translate/hooks/usePopoverExplain.ts`
    - Owns target click behavior and define/explain fetch lifecycle.
  - Keep `useSourceRevealNav` where it is, but narrow inputs to essential state only.
- Components:
  - `TranslateInputPane.tsx` (language/sample selectors, textarea, upload, start action)
  - `ReaderPane.tsx` (text surface + paragraph grid + anchored popover)
  - `ReaderToolbar.tsx` (page controls, blur mode controls, help)

Keep `page.tsx` as thin orchestration glue that composes the hooks and components.

---

### 2) Normalize auth user sync path through BFF

- Current files:
  - `apps/web/components/AppUserProvider.tsx`
  - `apps/web/lib/api.ts`
  - `services/api/src/api/main.py` (`GET /me`)
- Problem:
  - `/me` requests are browser -> Python API direct, while other app features go browser -> Next BFF -> Python API.
  - This creates inconsistent auth/network behavior and more environment/CORS edge cases.

#### Recommendation

Add a Next BFF route for `/me` and route AppUserProvider through it:

- New route:
  - `apps/web/app/api/me/route.ts`
- Behavior:
  - Accept bearer token from client (or fetch server-side if you later move auth server-side).
  - Forward to Python `/me` with standardized error handling.
- Update:
  - `AppUserProvider` should call `/api/me` (not `NEXT_PUBLIC_API_URL` directly).

---

### 3) Break up FastAPI “god module”

- Current hotspot:
  - `services/api/src/api/main.py`
- Problem:
  - App creation, config, model initialization/caching, request schemas, route handlers, DB auth, and TTS integration are all in one module.

#### Recommendation

Adopt a standard FastAPI package layout:

- `services/api/src/api/main.py`
  - only app factory and router inclusion.
- `services/api/src/api/core/settings.py`
  - env/config model (Pydantic settings).
- `services/api/src/api/core/lifespan.py`
  - startup initialization for aligner/segmenters/gemini caches.
- `services/api/src/api/routers/translate.py`
- `services/api/src/api/routers/align.py`
- `services/api/src/api/routers/define_explain.py`
- `services/api/src/api/routers/pronounce.py`
- `services/api/src/api/routers/pages.py`
- `services/api/src/api/routers/me.py`
- `services/api/src/api/schemas/*.py`
  - request/response models per domain.
- `services/api/src/api/services/*.py`
  - business logic wrappers for translation, alignment, explanation, pronunciation.

This structure keeps HTTP concerns separate from core service logic.

---

### 4) Fix SQLite resource management in NLP define module

- Current hotspot:
  - `packages/babeling-nlp/src/babeling_nlp/define.py`
- Problem:
  - `sqlite3.connect(...)` is called multiple times without explicit close; this risks connection leaks under load.

#### Recommendation

Refactor DB access into context-managed helpers:

- Add helper:
  - `def with_conn():` or `@contextmanager` returning `(conn, cur)`.
- Use:
  - `with sqlite3.connect(DB_PATH) as conn:` everywhere.
- Optional:
  - Add a tiny repository layer (e.g., `DefinitionRepository`) to isolate SQL from domain logic.

Also add error handling for missing DB path and malformed schema.

---

## P1 Refactors

### 5) Standardize Next API route forwarding

- Current files:
  - `apps/web/app/api/*/route.ts`
- Problem:
  - Repeated forwarding patterns, inconsistent error handling/status propagation, and repetitive payload re-shaping.

#### Recommendation

Create shared forwarding utilities:

- `apps/web/lib/server/apiForward.ts`
  - `forwardJson(path, payload, opts)`
  - standard timeout, JSON parse guards, and status mapping.
- `apps/web/lib/server/env.ts`
  - strict `getRequiredEnv("API_URL")`.

Then keep each route very small:

- parse/validate input
- call `forwardJson`
- return response

---

### 6) Add runtime validation for API contracts

- Current issue:
  - Route handlers and client assume response shapes without runtime validation.

#### Recommendation

- Add zod schemas in frontend:
  - `apps/web/types/contracts/*.ts`
- Validate both inbound route payload and backend response payload in Next BFF.
- Keep schemas aligned with Python Pydantic models.

This prevents silent shape drift from backend changes.

---

### 7) Move from `NEXT_PUBLIC_API_URL` to server-only `API_URL` for BFF

- Current files:
  - `apps/web/app/api/*/route.ts`
  - `apps/web/lib/api.ts`
- Problem:
  - Server code currently depends on a public env name.

#### Recommendation

- BFF routes should use `API_URL` (server-only env).
- Keep `NEXT_PUBLIC_*` variables only for true browser-side usage.
- Remove direct backend URL dependence from client where possible.

---

### 8) Introduce DB migrations for app_users

- Current files:
  - `services/api/src/api/database/init_db.py`
  - `services/api/src/api/database/delete_db.py`
- Problem:
  - `create_all` and `drop_all` are not a robust schema evolution workflow.

#### Recommendation

- Add Alembic:
  - baseline migration for `app_users`
  - future additive migrations for schema changes.
- Keep `init_db.py` only for local bootstrap/dev convenience if still needed.

---

### 9) Clarify and centralize language constants

- Current duplication:
  - frontend language list in `apps/web/app/(protected)/translate/page.tsx`
  - backend language map in `services/api/src/api/main.py`
  - NLP `NLP_LANGS` in `packages/babeling-nlp/src/babeling_nlp/segmenter.py`
- Problem:
  - Potential drift across layers.

#### Recommendation

- Create centralized language config per runtime:
  - frontend: `apps/web/lib/languages.ts`
  - backend: `services/api/src/api/core/languages.py`
- Keep canonical language codes and labels synchronized.

---

### 10) Separate TTS integration from route layer

- Current location:
  - `services/api/src/api/main.py` (`/pronounce` route)
- Problem:
  - External API details (headers/payload/voice map) live inline in route handler.

#### Recommendation

- Create service:
  - `services/api/src/api/services/tts.py`
- Route should only validate input and call service.
- Service should own:
  - voice mapping
  - provider URL
  - retries/timeouts
  - error translation

---

## P2 Refactors

### 11) Improve frontend typing and remove weak casts

- Current examples:
  - `apps/web/app/debug/page.tsx` uses `useState<any>`
  - `apps/web/app/(protected)/translate/page.tsx` uses `as any` in `removeEventListener`
- Recommendation:
  - Replace `any` with concrete types.
  - Use properly-typed listener options and shared handler refs where needed.

---

### 12) Move debug tooling out of app route tree

- Current file:
  - `apps/web/app/debug/page.tsx`
- Problem:
  - Hardcoded localhost URL and dev utility route in app tree.

#### Recommendation

- Either:
  - remove it, or
  - gate it behind dev-only condition and use BFF route + env-based URL.

---

### 13) Replace generic README with project-specific docs

- Current file:
  - `apps/web/README.md`
- Problem:
  - Still create-next-app boilerplate.

#### Recommendation

Document:

- architecture overview
- environment variables
- local run flow (web + api)
- auth and `/me` behavior
- API contract overview

---

### 14) Tighten module boundaries around token/alignment logic

- Current files:
  - `apps/web/app/components/ParagraphGrid.tsx`
  - `apps/web/app/components/HoverText/HoverText.tsx`
  - `apps/web/app/components/HoverText/clusterText.ts`
- Problem:
  - Alignment-sensitive rendering logic is spread across components.

#### Recommendation

Create a small alignment-view model utility layer:

- `apps/web/app/(protected)/translate/view-model/paragraphSlices.ts`
- `apps/web/app/(protected)/translate/view-model/highlightMaps.ts`

Keep components mostly presentational with precomputed view-model data.

---

## Suggested Implementation Phases

### Phase 1 (safe + high ROI)

1. Add BFF `/api/me` and migrate `AppUserProvider` to it.
2. Add shared Next API forwarding helper and migrate existing routes.
3. Fix SQLite connection management in `define.py`.

### Phase 2 (structural)

1. Split `translate/page.tsx` into hooks + components.
2. Extract TTS and other backend service logic from `main.py`.
3. Add contract validation (zod + Pydantic alignment checks).

### Phase 3 (platform hardening)

1. Add Alembic migrations.
2. Consolidate language constants.
3. Update docs and remove stale debug artifacts.

---

## Acceptance Checklist

- `translate/page.tsx` reduced to thin composition layer.
- All browser -> backend calls go through Next BFF consistently.
- No leaked SQLite connections in `babeling_nlp.define`.
- FastAPI route modules separated by domain.
- Shared forwarding/error utility used by all Next API routes.
- Migration workflow exists for Postgres schema changes.
- Docs describe actual architecture and env requirements.

