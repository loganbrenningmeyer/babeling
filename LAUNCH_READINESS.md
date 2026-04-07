# Launch Readiness Audit

Date: 2026-04-02

This document captures the main issues found during a publish-readiness review of Babeling, where they appear in the codebase, and what should be done before a future public launch.

Current assessment: the app looks close to a strong private beta, but it is not yet at the bar for a public paid launch.

## Summary

The product already has a strong core loop:

- document upload and parsing
- translation and annotation
- glossary saving
- a library surface
- an in-progress review flow

The gap is that the product surface is ahead of the production surface. The main remaining work is not just feature polish. It is launch hardening:

- finish the review feature into a real retained-learning system
- close auth and route protection gaps
- clean up lint and correctness issues
- harden external API handling
- add real deploy and environment documentation
- add basic test coverage and monitoring
- define monetization only after usage and quota boundaries are clear

## Launch Blockers

### 1. Review is still a prototype, not a complete review system

Issue:
- The review page currently behaves like a client-side deck of recent glossary items.
- There is no persisted review state, no scheduling, no due dates, no rating history, no streak model, and no backend review API.

Where:
- `apps/web/app/(protected)/review/page.tsx:67`
- `apps/web/app/(protected)/review/page.tsx:80`
- `apps/web/app/(protected)/review/page.tsx:111`
- `apps/web/app/(protected)/review/page.tsx:193`

Why it matters:
- This is the feature most likely to determine retention.
- If users lose progress or see random decks instead of a deliberate review cadence, the app will feel unfinished.

Recommendation:
- Add a real review domain model on the backend.
- Persist review events such as `again`, `hard`, `good`, and `easy`.
- Track due dates, last reviewed timestamps, review counts, and per-card state.
- Move deck construction to a backend query rather than rebuilding it from recent glossary items on the client.
- Keep the current UI, but feed it from persisted review state.

### 2. One review card is still an empty stub

Issue:
- `SelectionCard` exists but renders an empty container.

Where:
- `apps/web/app/(protected)/review/feature/components/SelectionCard.tsx:12`

Why it matters:
- Shipping a visible but unfinished review type weakens confidence in the whole review surface.

Recommendation:
- Either implement it fully before launch or remove it from the planned launch scope.
- If it is kept, define its grading model, reveal behavior, and mobile interaction pattern before wiring it into the deck.

### 3. The review route is not actually protected

Issue:
- Clerk middleware protects `/upload`, `/library`, `/preferences`, and `/documents`, but not `/review`.

Where:
- `apps/web/proxy.ts:4`

Why it matters:
- The review page lives under `(protected)` in the app tree, but route protection is enforced separately.
- This is a real access-control bug, not just polish.

Recommendation:
- Add `"/review(.*)"` to the protected route matcher.
- Re-test unauthenticated access to all protected entry points before launch.

### 4. Frontend lint is failing

Issue:
- `npm run lint` currently fails with 13 errors and 38 warnings.

Representative locations:
- `apps/web/app/(protected)/review/page.tsx:111`
- `apps/web/app/(protected)/review/feature/components/ContextClozeCard.tsx:393`
- `apps/web/app/(protected)/library/feature/hooks/useRecentGlossaryItems.ts:33`
- `apps/web/app/(protected)/documents/feature/hooks/useDocumentLoader.ts:39`
- `apps/web/app/(protected)/documents/feature/hooks/usePageSession.ts:160`
- `apps/web/app/(protected)/documents/feature/hooks/useSavedPageTranslation.ts:58`
- `apps/web/components/AppUserProvider.tsx:72`

Why it matters:
- Several of the errors are not cosmetic. They indicate state-management and type-safety problems.
- A launch candidate should build and lint cleanly.

Recommendation:
- Treat a clean lint pass as a release gate.
- Fix the review-related state-in-effect patterns first.
- Remove `any` types in shared hooks and providers before launch.
- Decide which warnings are acceptable and codify that policy, rather than carrying the current mixed state.

### 5. The review page is using effect-driven state setup that is already flagged by lint

Issue:
- The review queue and card types are initialized inside `useEffect` with immediate `setState` calls.

Where:
- `apps/web/app/(protected)/review/page.tsx:111`

Why it matters:
- This is currently being flagged by the React lint rules.
- It also makes the page feel more prototype-like than deterministic.

Recommendation:
- Derive queue state more explicitly.
- Separate static deck initialization from transition state.
- If randomness is part of the design, seed it deterministically per session or per deck.

### 6. `ContextClozeCard` still has launch-grade state management issues

Issue:
- `gradingReady` is reset synchronously inside an effect, which is currently failing lint.

Where:
- `apps/web/app/(protected)/review/feature/components/ContextClozeCard.tsx:391`

Why it matters:
- This is part of the core review flow.
- The card animation and grading logic need to be stable before launch.

Recommendation:
- Refactor grading state so it is derived from card state and timers, not reset synchronously in the effect body.
- Add a few focused interaction tests around fill, grade reveal, and incorrect-answer return.

## Production Hardening Gaps

### 7. Some Next API routes are still too thin for production

Issue:
- Several Next route handlers forward input directly to the backend with minimal validation and minimal error shaping.

Where:
- `apps/web/app/api/translate/route.ts:3`
- `apps/web/app/api/annotate/route.ts:3`
- `apps/web/app/api/pronounce/route.ts:3`

Why it matters:
- Public traffic will produce malformed input, upstream failures, and slow responses.
- Thin wrappers are fine, but they still need validation and predictable error behavior.

Recommendation:
- Use a shared request-validation pattern for all BFF routes.
- Return consistent error objects to the client.
- Add request timeouts and better backend failure messages.

### 8. Pronunciation depends on an external provider without resilience

Issue:
- The pronunciation route does a direct `requests.post(...)` with no explicit timeout, retry policy, or provider-specific error handling.

Where:
- `services/api/src/api/routes/pronounce.py:12`

Why it matters:
- This is exactly the kind of dependency that causes hanging requests and poor perceived quality.

Recommendation:
- Add explicit timeouts.
- Catch provider failures and convert them to controlled HTTP errors.
- Decide whether pronunciation is required for launch or can degrade gracefully.

### 9. Translation and annotation still use preview Gemini models

Issue:
- The NLP layer currently calls `gemini-3-flash-preview`.

Where:
- `packages/babeling-nlp/src/babeling_nlp/gemini_api.py:24`
- `packages/babeling-nlp/src/babeling_nlp/gemini_api.py:38`
- `packages/babeling-nlp/src/babeling_nlp/gemini_api.py:90`

Why it matters:
- Preview models are not a stable foundation for paid behavior, cost control, or repeatable UX.

Recommendation:
- Move to a stable production model before launch.
- Document fallback behavior if the primary model fails or changes behavior.
- Track prompt quality and output regressions after the switch.

### 10. Core backend config is still brittle and under-documented

Issue:
- Core runtime values are required through environment variables, but there is no checked-in example environment file.

Evidence in code:
- `services/api/src/api/main.py:25`
- `services/api/src/api/database/db.py:4`
- `services/api/src/api/database/auth.py:7`
- `services/api/src/api/config.py:22`
- `apps/web/lib/server-api.ts:38`

Additional note:
- No `.env.example`, `.env.sample`, or similar template was found at the repo root or package roots during this review.

Why it matters:
- Launches fail on missing configuration more often than on application logic.

Recommendation:
- Add a root or per-service environment template.
- Document every required variable, whether it is required in local dev, staging, and production, and what values it expects.

### 11. CORS setup needs a production review

Issue:
- CORS currently reads a single environment value into `allow_origins`.

Where:
- `services/api/src/api/main.py:25`

Why it matters:
- That may be fine for one deployed frontend origin, but it is fragile for preview, staging, local dev, and custom domains.

Recommendation:
- Decide whether `CORS_ORIGINS` is a comma-separated list or a single origin and parse it explicitly.
- Document expected origin values for each environment.

## Release Quality Gaps

### 12. Deploy documentation is still missing

Issue:
- The frontend README is still the default Next.js template.

Where:
- `apps/web/README.md:1`

Why it matters:
- Anyone trying to deploy or operate the app will have to reverse-engineer setup from the code.

Recommendation:
- Replace it with project-specific docs.
- Document local dev, required services, environment variables, backend startup, artifact paths, and deployment steps.

### 13. There is no obvious app-level error boundary or loading boundary strategy

Issue:
- No `error.tsx`, `global-error.tsx`, `loading.tsx`, or `not-found.tsx` files were found under `apps/web/app` during this review.

Why it matters:
- The app relies on multiple external services and long-running operations.
- Without boundaries, failures are more likely to surface as broken screens instead of managed product states.

Recommendation:
- Add route-level loading and error boundaries for the highest-value surfaces:
  - documents
  - library
  - review
  - upload

### 14. Automated test coverage is not at launch level

Issue:
- No web test runner config was found.
- No test script is defined in `apps/web/package.json`.
- The API package does not define a test workflow in `services/api/pyproject.toml`.

Where:
- `apps/web/package.json:6`
- `services/api/pyproject.toml:5`

Additional note:
- The repo does contain a `testing/` directory with parsing artifacts and scripts, but not a clearly integrated automated release test suite.

Why it matters:
- You need at least a small safety net before pushing production changes to translation, annotation, parsing, and review.

Recommendation:
- Add a minimum release suite:
  - one auth smoke test
  - one document upload/parsing test
  - one translation flow test
  - one glossary save/load test
  - one review card interaction test

### 15. Monitoring and error reporting are not yet visible in the repo

Issue:
- Vercel Analytics and Speed Insights are installed, but no error tracking or backend monitoring setup was found during this review.

Where:
- `apps/web/app/layout.tsx:1`

Why it matters:
- Analytics alone will not tell you why users fail to upload, annotate, or review.

Recommendation:
- Add frontend and backend error reporting before a public launch.
- Log provider failures for Gemini, pronunciation, and parsing separately.

## Plans And Monetization

### 16. Billing should wait until the usage model is explicit

Issue:
- No billing, plan, checkout, webhook, or quota-enforcement infrastructure was found in the app code during this review.

Why it matters:
- Pricing before metering usually produces a weak free tier and a confused paid tier.

Recommendation:
- Do not add paid plans until you define what is being constrained:
  - monthly documents
  - monthly translated pages
  - annotation volume
  - pronunciation usage
  - review volume
- Add instrumentation first so pricing is based on real usage rather than guesses.

### 17. Review should feel durable before it becomes a paid feature

Issue:
- Review is the most obvious candidate for a sticky premium feature, but it is currently the least production-ready part of the product.

Where:
- `apps/web/app/(protected)/review/page.tsx:67`
- `apps/web/app/(protected)/review/feature/components/SelectionCard.tsx:12`

Recommendation:
- Make review reliable and stateful first.
- Then evaluate whether plans should gate review depth, saved items, or AI-heavy features instead.

## Recommended Sequence Before Launch

### Phase 1: Close real correctness gaps

1. Protect `/review` in Clerk middleware.
2. Clean up the failing lint errors.
3. Finish or remove `SelectionCard`.
4. Refactor review queue and card state so the review page is deterministic and stable.

### Phase 2: Turn review into a real feature

1. Add backend review state and review events.
2. Persist card outcomes and due state.
3. Add progress indicators, empty states, and a completed-deck state.
4. Add a small review interaction test suite.

### Phase 3: Harden production behavior

1. Add validation and consistent error shaping to all Next API wrappers.
2. Add timeouts and controlled failures for external providers.
3. Switch off preview models.
4. Add route-level loading and error boundaries.

### Phase 4: Make deployment repeatable

1. Replace the placeholder README docs.
2. Add `.env.example` or equivalent templates.
3. Document frontend deploy, backend deploy, database setup, Clerk setup, model artifact paths, and required secrets.
4. Rehearse a clean deploy from scratch.

### Phase 5: Prepare for monetization

1. Add instrumentation for usage and latency.
2. Define quotas based on actual behavior.
3. Add plans only after the free-to-paid boundary is obvious and enforceable.

## Verification Notes

These checks were run during the review:

- `npm run lint`
  - Result: failed with 13 errors and 38 warnings.
- `npm run build`
  - Result: could not be fully validated in the sandbox because `next/font` attempted to fetch Google Fonts and network access was blocked in this environment.

This document should be treated as a launch-prep checklist, not a permanent architecture spec. Update it as items are resolved.
