# Babeling Premium Features Plan

This document focuses on the features most likely to move Babeling from "impressive product" to "something users will pay for repeatedly."

It is not an error-handling or reliability checklist. It is a product-value plan based on the current implemented experience:

- strong bilingual reader
- aligned token hover
- inline definition and explanation popovers
- glossary saving
- basic review flow
- document import and library persistence

The main product gap is clear: the reading experience is already compelling, but the learning loop still needs to become indispensable.

## Priority Scale

- `P0`: critical for premium willingness to pay
- `P1`: high leverage and should follow soon after P0
- `P2`: valuable differentiators, but not the first thing blocking premium feel

## Summary

| Priority | Feature | Premium Impact | Why It Matters |
| --- | --- | --- | --- |
| P0 | Real spaced repetition and due scheduling | 10/10 | Turns review from a nice extra into a habit-forming system |
| P0 | Phrase, collocation, and grammar capture | 10/10 | Makes the product useful for actual language acquisition, not just word lookup |
| P0 | Adaptive reading assistance based on learner state | 9/10 | Makes the reader feel personalized instead of static |
| P1 | Progress, mastery, and learning feedback | 9/10 | Users pay more readily when improvement is visible |
| P1 | Trust layer for explanations and saved items | 9/10 | Premium users must trust the app's teaching quality |
| P1 | Faster progressive reading sessions and smart prefetch | 8/10 | Perceived speed is product value in a reading app |
| P1 | Touch-first mobile reader UX | 8/10 | Premium subscriptions lose value fast if the core loop is desktop-only |
| P2 | Listening and pronunciation study modes | 7/10 | Strong upsell for serious learners, but not the first blocker |
| P2 | Curated onboarding and guided first-win flows | 7/10 | Helps conversion, but only after the core loop is strong |

## P0. Real Spaced Repetition And Due Scheduling

### Why this is critical

The current review flow is visually good, but it still behaves more like a shuffled practice deck than a true learning system. Premium users expect the app to remember what they know, what they struggle with, and what to show next.

Without this, review feels optional. With it, Babeling becomes something users come back to daily.

### What the user should feel

- "This app knows what I am about to forget."
- "My review queue is small, focused, and worth doing every day."
- "Saving a word or phrase in the reader actually matters later."

### Recommended implementation

#### 1. Introduce separate study-state persistence

Do not keep this logic implicit inside glossary items alone. Add dedicated study tables in the API service database layer.

Recommended schema direction:

- `study_items`
  - `id`
  - `user_id`
  - `item_type` (`word`, `phrase`, `grammar`)
  - `source_glossary_item_id` nullable
  - `src_lang`
  - `tgt_lang`
  - `prompt_language`
  - `status` (`new`, `learning`, `review`, `mastered`, `suspended`)
  - `created_at`
  - `updated_at`
- `study_item_variants`
  - `id`
  - `study_item_id`
  - `card_type` (`recognition`, `context_cloze`, `production`, `listening`)
  - `enabled`
  - `weight`
- `review_states`
  - `study_item_id`
  - `stability`
  - `difficulty`
  - `due_at`
  - `last_reviewed_at`
  - `lapse_count`
  - `success_count`
  - `scheduled_days`
- `review_events`
  - `id`
  - `study_item_id`
  - `rating` (`again`, `hard`, `good`, `easy`)
  - `card_type`
  - `reviewed_at`
  - `scheduled_due_at_before`
  - `scheduled_due_at_after`

This separation matters because a saved term and a scheduled review item are related, but not identical.

#### 2. Start with a simple scheduler, then move to FSRS

Recommended rollout:

1. Build v1 with a simple SM-2 style or interval-based scheduler.
2. Once the product is stable and event history exists, upgrade to FSRS-style scheduling.

Why:

- simple scheduling is faster to ship
- FSRS is better long term, but only once you trust your review event data

#### 3. Replace random queue generation in the review page

Current review flow in `apps/web/app/(protected)/review/page.tsx` should stop shuffling all glossary items into a session.

Instead:

- fetch only due items plus a small number of new items
- prioritize overdue and recently lapsed items
- allow per-language filtering, but keep due logic primary
- show counts for `due`, `new`, and `mastered today`

Recommended frontend additions:

- daily review header
- due count
- estimated session time
- "new today" cap
- rating buttons: `Again`, `Hard`, `Good`, `Easy`

#### 4. Add review-session API routes

Recommended Next wrappers:

- `apps/web/app/api/review/session/route.ts`
- `apps/web/app/api/review/grade/route.ts`
- `apps/web/app/api/review/stats/route.ts`

Recommended Python service endpoints:

- `POST /review/session`
- `POST /review/grade`
- `GET /review/stats`

The Next routes should stay thin. The scheduling logic belongs in `services/api`.

#### 5. Expand card types, but keep one scheduler

Different card types should be variants of the same underlying study item, not separate unrelated entities. A saved term can produce:

- recognition card
- context cloze card
- production card
- listening card later

This lets the scheduler adapt difficulty while keeping one mastery state per concept.

### Priority rating

- Premium impact: `10/10`
- Implementation urgency: `10/10`
- Recommended build order: first

## P0. Phrase, Collocation, And Grammar Capture

### Why this is critical

Single-word lookup is useful, but serious learners often need help with:

- fixed phrases
- multi-word expressions
- verb-preposition patterns
- idioms
- grammar constructions

If Babeling only saves isolated words, it will feel helpful but shallow. If it can capture the actual thing the learner struggled with in context, it becomes much more defensible as a premium product.

### What the user should feel

- "I can save the exact expression I needed, not just one token."
- "This teaches how the language works in real text."
- "My review deck looks like actual language I encountered while reading."

### Recommended implementation

#### 1. Add multi-token selection in the reader

Right now interaction is centered around single target-token clicks in:

- `apps/web/app/(protected)/documents/feature/hooks/useReaderInteraction.ts`
- `apps/web/app/(protected)/documents/feature/components/HoverText/HoverText.tsx`
- `apps/web/app/(protected)/documents/feature/components/Annotate/AnnotateCard.tsx`

Add a second interaction mode:

- tap or drag to select a span in the target pane
- preserve token index boundaries
- anchor the popover to the selected span, not just one word

Suggested first version:

- shift-click on desktop
- tap-select start/end on mobile
- selection constrained to a sentence initially

#### 2. Generalize glossary items into knowledge items

Current glossary persistence is word-oriented. Expand the domain model so saved items can represent:

- `word`
- `phrase`
- `grammar`

Recommended data additions:

- `item_type`
- `surface_text`
- `lemma_text` nullable
- `token_start`
- `token_end`
- `span_text`
- `explanation_kind`
- `notes` nullable

Keep the existing word save flow working, but make the data model broad enough for richer saves.

#### 3. Add phrase and grammar generation in the annotation backend

The annotation API currently returns definition and usage data for a clicked token. Extend it so the backend can also produce:

- phrase-level gloss
- literal translation when useful
- explanation of why the phrase means what it means
- grammar note for the construction
- example transformations

Recommended backend shape:

- keep token-aligned context input
- add `selection_start_idx`
- add `selection_end_idx`
- add `selection_type`

Then branch prompt behavior in `services/api` based on whether the user selected one word or a span.

#### 4. Expand review cards around real context

Once saved spans exist, review should support:

- phrase recognition
- fill-the-gap phrase cloze
- meaning choice for idioms
- grammar pattern recognition
- production prompt from source sentence to target phrase

The best source material is already in your saved context alignment model, so reuse it rather than generating synthetic cards first.

### Priority rating

- Premium impact: `10/10`
- Implementation urgency: `9/10`
- Recommended build order: second

## P0. Adaptive Reading Assistance Based On Learner State

### Why this is critical

The current reader is feature-rich, but still mostly static. Premium readers should adapt to what the learner knows and how much support they want.

This is what turns the app from "bilingual reading interface" into "guided reading system."

### What the user should feel

- "The app gives me just enough help."
- "It hides easy things and helps with hard things."
- "The amount of support changes as I improve."

### Recommended implementation

#### 1. Add familiarity state per token or lemma

At read time, derive a familiarity score from:

- saved glossary presence
- review status
- recent failures
- recent successes
- explicit user ignore/known actions

You do not need perfect NLP inference at first. A lemma-level familiarity map per language pair is enough to begin.

#### 2. Add reader assistance modes

Recommended modes:

- `Full Assist`: current bilingual experience
- `Balanced`: hide familiar words, keep unknown words emphasized
- `Challenge`: source mostly blurred, target explanations on demand
- `Minimal`: translation pane hidden until requested

These modes should live in reader UI state, alongside existing blur state in `ReaderSession["ui"]`.

#### 3. Add unknown-word emphasis

Instead of making all target text look equally interactive, visually distinguish:

- new or low-mastery words
- saved but not mastered items
- mastered items

Suggested UX:

- low-mastery terms get subtle underline or tint
- saved items get a lightweight icon or badge state in popovers
- mastered items stop demanding attention

#### 4. Reduce assistance over time

Once a user repeatedly succeeds on an item:

- stop auto-highlighting it
- stop suggesting save actions for it
- downgrade popover prominence
- bias review generation toward harder contexts

This preserves focus and makes the system feel intelligent.

### Priority rating

- Premium impact: `9/10`
- Implementation urgency: `9/10`
- Recommended build order: third

## P1. Progress, Mastery, And Learning Feedback

### Why this matters

Users pay more readily when the product proves it is working. Right now the library is useful, but it does not yet strongly communicate growth.

### What to add

- daily review completion
- active learning items
- mastered items
- retention estimate
- reading streak
- pages read this week
- target-language time spent reading
- document-specific vocabulary growth

### Recommended implementation

#### 1. Add a lightweight learning dashboard

Start in the library and review surfaces:

- `due today`
- `reviewed today`
- `words learning`
- `phrases learning`
- `mastered this week`
- `current streak`

Avoid building a large analytics product first. A compact, useful dashboard is enough.

#### 2. Persist meaningful events

To support credible stats, store events for:

- review completed
- document opened
- page completed
- glossary item saved
- phrase saved
- pronunciation played

This can begin as simple database records in `services/api` and later feed richer insights.

#### 3. Add document-level payoff

Inside the reader or document view, show:

- percent of pages translated
- percent of pages read
- number of saved items from this document
- number of mastered items from this document

That connects effort to visible progress.

### Priority rating

- Premium impact: `9/10`
- Implementation urgency: `7/10`
- Recommended build order: after the first three P0 items

## P1. Trust Layer For Explanations And Saved Items

### Why this matters

Premium language products fail fast when users sense that explanations are slick but unreliable.

Your annotation surface is already one of the product's strongest assets. It needs stronger trust cues, not just more content.

### What to add

- mark ambiguity clearly
- show alternate glosses when confidence is low
- distinguish literal meaning from natural meaning
- let users dismiss a bad explanation
- let users edit saved gloss/notes
- keep explanation style concise and consistent

### Recommended implementation

#### 1. Add confidence-aware annotation output

The backend should return more than a single gloss string when needed. Suggested additions:

- `confidence`
- `alternates`
- `is_literal`
- `register`
- `notes`

You do not need to expose all fields visually every time. Use them to decide when the UI should be terse versus cautious.

#### 2. Add user correction hooks

For saved items, support:

- edit gloss
- add note
- mark as "not useful"
- suspend from review

That prevents low-quality output from poisoning the learning system.

#### 3. Tighten prompt outputs

In `services/api/src/api/prompts`, optimize for:

- shorter explanations
- stable structure
- fewer hedged paragraphs
- examples that are tightly tied to the selected token or span

The goal is not more prose. The goal is better teaching.

### Priority rating

- Premium impact: `9/10`
- Implementation urgency: `7/10`
- Recommended build order: alongside P1 stats or immediately after them

## P1. Faster Progressive Reading Sessions And Smart Prefetch

### Why this matters

In a reading product, speed is value. Waiting breaks immersion.

You already have the right architectural direction in `usePageSession.ts`: cached page sessions, saved translations, and page-based orchestration. The next step is to make the experience feel instant more often.

### Recommended implementation

#### 1. Split page loading into visible stages

Instead of treating the page session as one monolithic load:

- show source text immediately
- show translated text as soon as available
- then hydrate word alignment
- then enable deep annotation interactions

This improves perceived quality more than a modest raw latency reduction.

#### 2. Prefetch adjacent pages

When a user lands on page `N`:

- prefetch translation/alignment state for `N + 1`
- optionally prefetch `N - 1`
- respect rate limits and current device/network state

Good prefetching is especially important for premium reading flow.

#### 3. Warm likely annotations

Once a page loads:

- optionally precompute lemma or dictionary candidates for high-frequency unknown words
- cache by token span and language pair

Do not precompute everything. Use likely interactions only.

### Priority rating

- Premium impact: `8/10`
- Implementation urgency: `7/10`
- Recommended build order: after P0 core learning features

## P1. Touch-First Mobile Reader UX

### Why this matters

A reader product that feels excellent only with mouse hover will not feel premium in normal consumer usage.

### Recommended implementation

#### 1. Convert hover assumptions into tap-first patterns

For mobile:

- tap target token to highlight alignment
- second tap opens annotation
- long press starts span selection

Hover can remain on desktop, but mobile needs its own interaction design.

#### 2. Improve popover behavior on small screens

Replace anchored popovers with:

- bottom sheet on phone
- side sheet on tablet
- keep anchored popover on desktop

This preserves readability and avoids cramped overlays.

#### 3. Make blur/reveal feel deliberate on touch

Current blur interaction is promising. On touch devices:

- larger tap targets
- sentence and paragraph reveal buttons
- visible state indicator for revealed segments

### Priority rating

- Premium impact: `8/10`
- Implementation urgency: `7/10`
- Recommended build order: in parallel with other P1 polish

## P2. Listening And Pronunciation Study Modes

### Why this matters

Pronunciation already exists as a utility. To feel premium, it should become part of the learning system.

### Recommended implementation

- sentence replay loop
- phrase replay loop
- listen-then-recall cards
- minimal-pair or dictation-style prompts later
- save preferred voices and playback speed

Implementation path:

1. reuse existing pronunciation controls in the annotation and glossary surfaces
2. create listening review variants from saved phrases
3. add optional autoplay in review sessions for listening cards

### Priority rating

- Premium impact: `7/10`
- Implementation urgency: `5/10`
- Recommended build order: after the main study system is stable

## P2. Curated Onboarding And Guided First-Win Flows

### Why this matters

Good onboarding improves conversion, but it cannot compensate for a weak core product. That is why it is P2, not P0.

### Recommended implementation

- offer a small curated set of starter texts by language
- ask the user for goal and comfort level
- set initial assistance mode automatically
- guide them through saving their first item
- guide them into their first due review session

This is mostly a product packaging layer around the stronger P0 and P1 foundations.

### Priority rating

- Premium impact: `7/10`
- Implementation urgency: `4/10`
- Recommended build order: once the core loops are robust

## Recommended Build Sequence

### Phase 1: Make review real

1. Build study-state tables and review event tables.
2. Replace random review queue with due-item sessions.
3. Add rating-based scheduling and review stats.
4. Keep existing recognition and context-cloze cards, but make them scheduler-driven.

### Phase 2: Expand what can be learned

1. Add phrase span selection in the reader.
2. Generalize glossary items into broader saved knowledge items.
3. Add phrase and grammar annotation responses.
4. Add phrase-aware review cards.

### Phase 3: Make the reader adaptive

1. Add familiarity state.
2. Add reader assistance modes.
3. Add unknown-word emphasis and mastered-item de-emphasis.
4. Use review state to drive reading help.

### Phase 4: Make progress visible and trustworthy

1. Add dashboard and learning stats.
2. Add edit/suspend/dismiss controls for saved items.
3. Improve annotation confidence handling and prompt outputs.

### Phase 5: Increase polish where it compounds

1. Improve progressive load and prefetch.
2. Improve mobile/touch interactions.
3. Add listening study variants.
4. Add curated onboarding.

## What Not To Prioritize First

These are useful, but they should not outrank the core premium blockers above:

- large-scale gamification
- social features
- badges and achievements without learning depth
- broad content marketplace ideas
- very advanced analytics before the scheduler and saved-item model are solid
- adding many more review card types before due scheduling exists

## Final Recommendation

If only three things get built next, they should be:

1. Real SRS with due scheduling and review events
2. Phrase and grammar capture with context-aware saves
3. Adaptive reading assistance driven by learner state

That combination would materially change Babeling's subscription viability, because it would connect reading, understanding, saving, reviewing, and improvement into one coherent premium loop.
