# Exam Mode

**Purpose:** Calibrate learning maps to real exam/certification blueprints, offer an optional informational pretest at the start, and offer a full mock exam once sufficient mastery is reached.

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
    question_style: multiple-choice # exam-level default; per-domain overrides below
  domains:
    - name: Cluster Architecture
      weight_pct: 25
      question_style: hands-on # optional; inherits format.question_style if omitted
    - name: Workloads
      weight_pct: 15
      # question_style omitted → inherits multiple-choice from format
```

**Blueprint staleness:** On a returning session, if `exam_blueprint.researched` is more than 6 months old, offer once:

> "Your [exam] blueprint is from [date] — want me to re-research it for updated domains or weights? [y/n]"

If accepted, re-run Blueprint Research and overwrite `exam_blueprint`. If declined, continue with the stored blueprint.

Pass as the `examBlueprint` argument to `initMap()`:

```javascript
const { initMap } = require('./scripts/init-map.js');
const { mapPath } = initMap(topic, goal, domain, mapData, examBlueprint);
```

## Map Generation (brand-new map only)

Applies when exam-mode is confirmed for a topic with **no existing map**.

- Name sections after the exam's own domains (e.g. "Cluster Architecture (25%)," "Workloads (15%)") instead of Foundation/Core/Advanced.
- Order concepts by dependencies first, exactly as the normal flow (a concept never appears before its `requires`, consistent with `enables` on the concepts it unlocks). Exam domain weight is only a **secondary** sort key: among concepts with equally-satisfied prerequisite depth, list higher-weighted-domain concepts first.
- Pass the researched blueprint as `examBlueprint` to `initMap()` alongside the exam-domain `mapData.sections`.

## Existing Map Case

Applies when the exam goal lands on a topic that **already has a map** - adding exam-mode as a second goal (SKILL.md "Goal Change: Multiple Goals," option b).

- Blueprint research (above) still runs, and `exam_blueprint` is still stored on the existing map's frontmatter (load with `loadState`, set `data.exam_blueprint`, save with `saveState` - do not call `initMap` again, it would reset the map).
- Do **not** rename or restructure existing sections - the map is shared across goals (Strategy C in SKILL.md), and restructuring would disrupt concepts/progress tied to other goals.
- Instead, list the concepts belonging to higher-weighted exam domains as `priorityConcepts` when calling `createGoalFilter` (`scripts/goal-manager.js`) - this prioritizes them within the existing section structure without touching section names.
- Pretest (below) is still offered if `pretest_offered` is not already `true` on the map.
- `exam_blueprint` is per-map (not per-goal). If the map already has an `exam_blueprint` from a previous exam goal, the new research overwrites it. Tell the user: "Updating the exam blueprint to [new exam] — the previous [old exam] blueprint will be replaced."

## Pretest

Offered once, right after exam-mode is confirmed (both brand-new and existing-map cases), always skippable. Set `pretest_offered: true` in map frontmatter immediately when the offer is shown — whether accepted, declined, or abandoned — so it is never re-shown on returning sessions.

### Plan and confirm

Derive the plan and ask in a single message (no two-step confirmation):

**Step 1 — Normalize weights.** Web-researched weights may not sum to 100% due to rounding. Normalize before applying the formula:

```
normalized_pct = (domain.weight_pct / sum_of_all_weight_pcts) × 100
```

**Step 2 — Allocate per domain:**

```
per_domain = round(total_questions × (normalized_pct / 100) × 0.25), floor 2
```

**Step 3 — Apply cap.** If the sum exceeds 20, scale down proportionally: multiply each allocation by `20 / sum`, re-apply floor 2, then adjust the largest domain by ±1 to reach exactly 20.

**Step 4 — Mark skipped domains.** Check `question_style` on each domain entry (falls back to `format.question_style` if absent). Any domain with `question_style: hands-on` or `question_style: performance` is skipped. If every domain is skipped, skip the pretest entirely:

> "This exam is entirely hands-on — a text-based pretest wouldn't give a useful signal. Skipping the diagnostic."

Show the plan and ask in one message:

```
Exam: AWS SAA-C03  (65 questions · 130 min · 72% passing)

Quick diagnostic — want to see where you're starting from?
  Design Resilient Architectures   (30%)  → 5 questions
  Design High-Performing Arch.     (28%)  → 5 questions
  Design Secure Architectures      (24%)  → 4 questions
  Design Cost-Optimized Arch.      (18%)  → 3 questions
Total: 17 questions  [y/n]
```

**Fallback (no blueprint / tier 3):** 8–12 questions. If domain names are known, distribute evenly and use the same table format. If no domain names are known, omit the table:

```
Quick diagnostic — want to see where you're starting from?
~10 questions  [y/n]
```

### Delivery

Ask **one question at a time** — multiple-choice, assessment style. Write questions that test existing knowledge: "Which of these correctly describes X?" or "In scenario Y, what is the right approach?" — not Socratic/predictive questions. Wait for the answer before showing the next. After each answer, acknowledge briefly (correct/incorrect + one-line explanation), then continue.

**If the user abandons mid-pretest:** stop immediately, skip the summary. The `pretest_offered: true` flag is already set, so the pretest is not re-offered next session.

### Effect: informational only

After all questions, produce a one-time summary:

> "Rough starting level: Intermediate. Strong on Resilient Architectures and Security, weaker on Cost Optimization."

Do **not** change any concept's `status`, reorder anything, or skip any activity — every concept still runs the full Learn → Synthesize → Practice → Calibrate journey regardless of pretest performance. Do not persist the result — it is a session-only message.

## Mock Test

Offered once mastery reaches ≥80% of concepts in the map. Repeatable — the learner may run it multiple times.

### Trigger

After every Calibrate activity, check the mastery threshold against the **active goal's filtered concept set** (use `filterMapByGoal` from `scripts/goal-manager.js`). Exclude archived concepts. A concept with `status: mastered` counts regardless of whether it is overdue for review.

```
mastered_count / filtered_total >= 0.80
```

On first crossing, offer:

> "You've mastered X/Y concepts (Z%). Want to run a full mock exam to check readiness? [y/n]"

If declined, offer again after every subsequent concept mastered. Never auto-run.

### Hands-on-only exams

If `question_style` in the blueprint is `hands-on` and every domain is performance-task only, skip the mock test entirely:

> "This exam is entirely hands-on — a text-based mock would give a false signal. For realistic practice, use [official simulator / killer.sh / a real cluster]."

Do not offer a conceptual proxy as a substitute for a full mock.

### Plan and confirm

Show the exam format and a disclaimer before running:

```
Mock Exam: AWS SAA-C03
65 questions · 130 min time limit · 72% to pass

⚠ These questions are AI-generated approximations based on the official
  blueprint — not real exam questions.

Set a timer if you want realistic conditions. Run the mock? [y/n]
```

### Delivery

One question at a time — same options-based style as the pretest. Full question count from the blueprint (no sampling). After each answer, acknowledge briefly (correct/incorrect + one-line explanation), then continue without running score commentary.

**Per-domain allocation:** distribute the full question count proportionally by domain weight (normalize weights first, same as pretest step 1):

```
per_domain = round(total_questions × (normalized_pct / 100))
```

Adjust the largest domain by ±1 to make the total exact.

### Result

After all questions, show the verdict and per-domain breakdown:

```
Mock Exam Result — AWS SAA-C03

Score: 54/65 (83%)  ·  Passing: 72%  ·  Result: READY ✓

By domain:
  Resilient Architectures  (30%)   16/20  80%  ✓
  High-Performing Arch.    (28%)   15/18  83%  ✓
  Secure Architectures     (24%)   14/16  88%  ✓
  Cost-Optimized Arch.     (18%)    9/11  82%  ✓
```

If below passing score, highlight the weakest domain:

> "Not quite yet (68%). Focus on Cost Optimization (54%) — review those concepts and try again."

### Persist results

Append each attempt to map frontmatter so the learner can track improvement:

```yaml
mock_tests:
  - date: '2026-07-23T00:00:00.000Z'
    score_pct: 83
    passed: true
    domain_scores:
      - name: Resilient Architectures
        score_pct: 80
      - name: High-Performing Architectures
        score_pct: 83
      - name: Secure Architectures
        score_pct: 88
      - name: Cost-Optimized Architectures
        score_pct: 82
```

## Common Mistakes

| Mistake | Fix |
| --------- | ----- |
| Treating the pretest like a placement test | It's informational only — never skip or seed activities from it |
| Persisting pretest results | The pretest summary is session-only — never write it to the map |
| Re-offering the pretest on a returning session | Set `pretest_offered: true` when the offer is shown; never re-offer once set |
| Showing all pretest or mock test questions at once | Ask one question at a time, wait for the answer, then continue |
| Writing pretest questions in Socratic/predictive style | Pretest questions are assessment-style ("Which of these is correct?"), not discovery-guided |
| Using raw `weight_pct` directly in the formula | Normalize weights first (`weight_pct / sum_of_all_weight_pcts × 100`), then apply `normalized_pct / 100` |
| Not defining cap reduction when pretest total > 20 | Scale down proportionally, re-apply floor 2, adjust the largest domain to hit exactly 20 |
| Triggering the mock test before 80% mastery | Check `mastered / filtered_total >= 0.80` after every Calibrate — offer only on first crossing |
| Auto-running the mock test | Always offer it, never trigger automatically |
| Offering a conceptual proxy mock for hands-on-only exams | Skip the mock entirely and direct the user to an official simulator instead |
| Forgetting the disclaimer before mock test | Show "AI-generated approximations — not real exam questions" before the first question |
| Forgetting to persist mock test results | Append each attempt to `mock_tests` in map frontmatter |
| Searching for "exam questions" or "practice test" | Use "official exam guide"/"objectives"/"blueprint" phrasing — avoids braindump sources |
| Restructuring sections on an existing map | Only brand-new maps get exam-domain section names — existing maps use `priorityConcepts` instead |
| Sorting concepts by weight alone | Weight is a secondary key — dependencies (`requires`/`enables`) always come first |
| Retrying failed web research | Single search + single fetch, then fall through the tier chain |
