# Exam Mode

**Purpose:** Calibrate learning maps to real exam/certification blueprints, and offer an optional informational pretest.

**When to use:** After a goal is confirmed (first-session goal refinement, or a new goal added via the Goal Change flow) - BEFORE building or modifying the map.

## Detection

Check the confirmed goal text for exam/cert keywords or known certification names:

- Keywords: "pass," "certification," "cert," "exam"
- Known certification names: "CKA," "CKAD," "AWS SAA," "AWS DVA," "PMP," "CompTIA Security+" (extend as encountered)

On a match, confirm before acting:

> "This looks like exam/certification prep. I can research the official exam blueprint (domains, weighting, format) and calibrate your learning around it. Want me to? [y/n]"

Declined or no match -> proceed with the normal (non-exam) flow. Nothing below applies.

## Research Scope Guardrail

**In scope:** the exam's publicly published objectives/blueprint - domains, weight percentages, format, question count, time limit, passing score. Certifying bodies publish this themselves as study material (AWS exam guide PDFs, CompTIA objectives PDFs, PMI's ECO, Microsoft's "Skills measured" pages, CNCF's CKA curriculum, etc.).

**Never in scope:** actual exam questions, braindumps, leaked content, or "real exam answers" sources - regardless of whether they're found or the user asks for them directly.

## Blueprint Research (three-tier fallback)

1. **Web research.** One `WebSearch`, phrased toward official material ("official exam guide," "certification objectives," "exam blueprint" - never "exam questions" or "practice test," which surfaces unofficial content). Add a `site:` filter to the certifying body's domain when it's identifiable (e.g. `site:aws.amazon.com`, `site:comptia.org`, `site:kubernetes.io`). Follow with one `WebFetch` on the top result, only if its domain plausibly belongs to the certifying body. Single search + single fetch - no retries, no follow-up searches.

2. **AI knowledge fallback.** If step 1 fails, times out, or is inconclusive (fetch fails, or no discernible domain/weight breakdown in the content), and the exam is one you recognize, construct an approximate blueprint from your own knowledge.

3. **Generic fallback.** If neither produces a usable blueprint, tell the user:

   > "I couldn't find a published blueprint for [exam]. I'll build your map the normal way instead."

   Proceed with the standard Foundation/Core/Advanced map. No `exam_blueprint` data is stored.

**Source attribution:** tier 1 results are `source: official` with a `source_url`. Tier 2 results are `source: ai-estimated`, no `source_url`.

## Blueprint Schema

Store as a new `exam_blueprint` block in map frontmatter (see `references/state-format.md`):

```yaml
exam_blueprint:
  source: official # or ai-estimated
  source_url: 'https://kubernetes.io/docs/...' # omitted when source is ai-estimated
  researched: '2026-07-23T00:00:00.000Z'
  format:
    question_count: 60
    time_limit_minutes: 120
    passing_score: 66
    question_style: hands-on
  domains:
    - name: Cluster Architecture
      weight_pct: 25
    - name: Workloads
      weight_pct: 15
```

Pass as the `examBlueprint` argument to `initMap()`:

```javascript
const { initMap } = require('./scripts/init-map.js');
const { mapPath } = initMap(topic, goal, domain, mapData, examBlueprint);
```

## Map Generation (brand-new map only)

Applies when exam-mode is confirmed for a topic with **no existing map**.

- Name sections after the exam's own domains (e.g. "Cluster Architecture (25%)," "Workloads (15%)") instead of Foundation/Core/Advanced.
- Order concepts by dependencies first, exactly as the normal flow (see `references/concept-granularity.md`) - a concept never appears before its `requires`. Exam domain weight is only a **secondary** sort key: among concepts with equally-satisfied prerequisite depth, list higher-weighted-domain concepts first.
- Pass the researched blueprint as `examBlueprint` to `initMap()` alongside the exam-domain `mapData.sections`.

## Existing Map Case

Applies when the exam goal lands on a topic that **already has a map** - adding exam-mode as a second goal (SKILL.md "Goal Change: Multiple Goals," option b), or returning to a map whose active goal is exam-oriented.

- Blueprint research (above) still runs, and `exam_blueprint` is still stored on the existing map's frontmatter (load with `loadState`, set `data.exam_blueprint`, save with `saveState` - do not call `initMap` again, it would reset the map).
- Do **not** rename or restructure existing sections - the map is shared across goals (Strategy C in SKILL.md), and restructuring would disrupt concepts/progress tied to other goals.
- Instead, list the concepts belonging to higher-weighted exam domains as `priorityConcepts` when calling `createGoalFilter` (`scripts/goal-manager.js`) - this prioritizes them within the existing section structure without touching section names.
- Pretest (below) is still offered.

## Pretest

Offered once, right after exam-mode is confirmed (both brand-new and existing-map cases), always skippable:

> "Want a quick diagnostic to see where you're starting from? [y/n]"

If accepted: a sampled multiple-choice quiz, same question style as the first (options) question in `references/activities/learn.md` - 5-8 questions total, sampled proportional to domain weight (more questions from higher-weighted domains).

**Effect: informational only.** Produce a one-time summary message, e.g.:

> "Rough starting level: Intermediate. Strong on Workloads, weak on Storage."

Do **not** change any concept's `status`, reorder anything, or skip any activity - every concept still runs the full Learn -> Synthesize -> Practice -> Calibrate journey regardless of pretest performance. Do not persist the result anywhere - it's a session-only message.

## Common Mistakes

| Mistake | Fix |
| --------- | ----- |
| Treating the pretest like a placement test | It's informational only - never skip or seed activities from it |
| Searching for "exam questions" or "practice test" | Use "official exam guide"/"objectives"/"blueprint" phrasing - avoids braindump sources |
| Restructuring sections on an existing map | Only brand-new maps get exam-domain section names - existing maps use `priorityConcepts` instead |
| Sorting concepts by weight alone | Weight is a secondary key - dependencies (`requires`/`enables`) always come first |
| Retrying failed web research | Single search + single fetch, then fall through the tier chain |
