# Exam Mode

**Purpose:** Calibrate learning maps to real exam/certification blueprints, offer an optional
informational pretest at the start, and offer a full mock exam once sufficient mastery is reached.

**When to use:** After a goal is confirmed (first-session goal refinement, or a new goal added via
the Goal Change flow) - BEFORE building or modifying the map.

## Detection

Check the confirmed goal text for exam/cert keywords or known certification names:

- Keywords: "pass," "certification," "cert," "exam"
- Known certification names: "CKA," "CKAD," "AWS SAA," "AWS DVA," "PMP," "CompTIA Security+" (extend as encountered)

On a match, confirm before acting:

> "This looks like exam/certification prep. I can research the official exam blueprint (domains,
> weighting, format) and calibrate your learning around it. Want me to? [y/n]"

Declined or no match -> proceed with the normal (non-exam) flow. Nothing below applies.

## Research Scope Guardrail

**In scope:** the exam's publicly published objectives/blueprint - domains, weight percentages, format, question count,
time limit, passing score. Certifying bodies publish this themselves as study material (AWS exam guide PDFs, CompTIA
objectives PDFs, PMI's ECO, Microsoft's "Skills measured" pages, CNCF's CKA curriculum, etc.).

**Never in scope:** actual exam questions, braindumps, leaked content, or "real exam answers"
sources - regardless of whether they're found or the user asks for them directly.

## Blueprint Research (three-tier fallback)

1. **Web research.** One `WebSearch`, phrased toward official material ("official exam guide,"
   "certification objectives," "exam blueprint" — never "exam questions" or "practice test,"
   which surfaces unofficial content). Add a `site:` filter to the certifying body's domain
   when it's identifiable (e.g. `site:aws.amazon.com`, `site:comptia.org`, `site:kubernetes.io`).
   Follow with one `WebFetch` on the top result, only if its domain plausibly belongs to the
   certifying body.

   **Extraction targets:** From whatever content is fetched, extract:
   - All question format types mentioned anywhere in the document → `format.question_styles` (array).
   - For each domain: name, weight, per-domain format overrides if listed, and all sub-topic /
     task / objective bullets → `domains[].objectives`.

   **Objective normalization — use the cert body's own grouping as the primary guide:**
   - **Combine** bullets the cert body groups under a single task heading, or that share an
     action verb and subject (e.g. "Explain supervised learning" and "Explain unsupervised
     learning" under a shared "ML paradigms" task → one objective: "Explain ML paradigm types:
     supervised, unsupervised, reinforcement").
   - **Split** a bullet only when it names two independent, non-overlapping testable topics with
     no shared grouping header (e.g. "Configure VPCs and manage IAM policies" → two objectives).
   - Each final string must begin with an action verb (Explain, Identify, Distinguish, Apply,
     Evaluate…) and cover exactly one testable area.

   **PDF handling:**
   - Text-based PDF (most cert body PDFs): extract normally. Set `content_type: pdf`.
   - Garbled / binary content: set `content_type: pdf-failed`. Skip objective extraction for all
     domains (AI fills at map generation time). Still attempt to recover domain names and weights
     from any surrounding HTML context or page title in the search result.

   **Second fetch — exception to the single-fetch rule:** If and only if the top result is a PDF
   that failed to parse (`content_type: pdf-failed`), make one additional `WebFetch` on the
   cert's main info page (the `/certification/…` overview URL, identifiable from the search
   result list). This is the only permitted second fetch — it does not apply to any other failure
   mode. If the second fetch also fails or is inconclusive, move to tier 2.

2. **AI knowledge fallback.** If step 1 fails, times out, or is inconclusive (fetch fails, or no
   discernible domain/weight breakdown in the content), and the exam is one you recognize,
   construct an approximate blueprint from your own knowledge. Mark `source: ai-estimated`,
   omit `source_url`. Do not populate `objectives` in tier 2 — the AI draws from knowledge at
   map generation time instead.

3. **Generic fallback.** If neither produces a usable blueprint, tell the user:

   > "I couldn't find a published blueprint for [exam]. I'll build your map the normal way instead."

   Proceed with the standard Foundation/Core/Advanced map. No `exam_blueprint` data is stored.

**Source attribution:** tier 1 results are `source: official` with a `source_url` and
`content_type` set. Tier 2 results are `source: ai-estimated`, no `source_url`.

## Blueprint Schema

Store as a new `exam_blueprint` block in map frontmatter (see `references/state-format.md`):

```yaml
exam_blueprint:
  source: official             # or: ai-estimated
  source_url: 'https://...'    # omitted when source is ai-estimated
  researched: '2026-08-17T00:00:00.000Z'
  content_type: webpage        # webpage | pdf | pdf-failed
  format:
    question_count: 85
    time_limit_minutes: 170
    passing_score: 72
    question_styles: [multiple-choice, ordering, matching]  # replaces question_style (string)
  domains:
    - name: Fundamentals of AI and ML
      weight_pct: 20
      question_styles: [multiple-choice, ordering]  # domain-level override; optional
      objectives:                                   # optional; omitted when not extractable
        - "Explain basic ML concepts: supervised, unsupervised, reinforcement learning"
        - "Describe common GenAI use cases: summarization, classification, generation"
        - "Identify appropriate model types for given business problems"
    - name: Fundamentals of Generative AI
      weight_pct: 24
      # question_styles omitted → inherits format.question_styles
      objectives:
        - "Explain foundation models, token limits, and embeddings"
        - "Distinguish RAG from fine-tuning and prompt engineering"
        - "Select appropriate GenAI services for a given use case on AWS"
```

**Field notes:**
- `content_type`: set by the research step — `webpage`, `pdf` (parsed successfully), or `pdf-failed` (garbled/binary).
- `question_styles` (plural array): replaces the old singular `question_style` string. Domain-level override replaces the format-level array entirely for that domain's questions.
- `objectives`: optional per domain. When present, seeds concept generation. When absent, AI fills from training knowledge.

**Backwards-compatibility — read-coercion rule:** When reading a map that has the old `question_style` field (singular string) instead of `question_styles`, treat it as `question_styles: [<value>]` — a single-element array. Apply this coercion first wherever delivery instructions reference `question_styles`. New maps always write `question_styles` (plural).

**Blueprint staleness:** On a returning session, if `exam_blueprint.researched` is more than 6 months old, offer once:

> "Your [exam] blueprint is from [date] — want me to re-research it for updated domains or weights? [y/n]"

If accepted, re-run Blueprint Research and overwrite `exam_blueprint`. If declined, continue with the stored blueprint.

Pass as the `examBlueprint` argument to `createMap()`:

```javascript
const { createMap } = require('./scripts/map.js');
const { mapPath } = createMap(topic, goal, domain, mapData.sections);
```

## Map Generation (brand-new map only)

Applies when exam-mode is confirmed for a topic with **no existing map**.

- Name sections after the exam's own domains (e.g. "Cluster Architecture (25%)," "Workloads
  (15%)") instead of Foundation/Core/Advanced.
- Order concepts by dependencies first, exactly as the normal flow (a concept never appears
  before its `requires`, consistent with `enables` on the concepts it unlocks). Exam domain
  weight is only a **secondary** sort key: among concepts with equally-satisfied prerequisite
  depth, list higher-weighted-domain concepts first.
- Pass the exam-domain sections to `createMap()` to build the map.

**Concept seeding from objectives:** When the blueprint contains `domains[].objectives`, use
them as the seed list for concepts in that domain's section. Each objective maps to one concept
— use the objective string as the concept's description anchor, then apply concept-granularity
rules (`references/concept-granularity.md`) to decide whether to keep it as-is, split it, or
merge it with an adjacent objective. The concept `name` is a short noun phrase derived from the
objective (not a verbatim copy).

**Map size policy:** When objectives produce more concepts than usual, do not merge aggressively
to hit a target count — apply granularity rules and let the map grow as large as the objectives
warrant. No artificial cap. The real exam's scope determines the map's scope.

**Fallback for domains without objectives:** For any domain where `objectives` is absent (tier-2
source, or a domain whose guide content was too thin to extract), generate concepts from AI
knowledge of that domain exactly as today.

**Example — concept seeding from one domain:**

```
Domain: "Fundamentals of Generative AI" (24%)
Objectives:
  - "Explain foundation models, token limits, and embeddings"
  - "Distinguish RAG from fine-tuning and prompt engineering"
  - "Select appropriate GenAI services for a given use case on AWS"

→ Generated concepts:
  - Foundation Models and Token Limits
    description: Core architecture of foundation models; how token limits affect
                 generation, context windows, and cost
  - Embeddings
    description: What embeddings are, how they represent semantic meaning,
                 and when to use embedding models vs. generative models
  - RAG vs Fine-tuning vs Prompt Engineering
    description: When to apply each technique; trade-offs in cost, latency,
                 data requirements, and update frequency
  - GenAI Service Selection on AWS
    description: Matching Bedrock, SageMaker JumpStart, etc. to business requirements

(First objective split into two concepts — "foundation models + token limits" and
"embeddings" are distinct testable areas with different `requires`/`enables` chains.)
```

## Existing Map Case

Applies when the exam goal lands on a topic that **already has a map** - adding exam-mode as a
second goal (SKILL.md "Goal Change: Multiple Goals," option b).

- Blueprint research (above) still runs, and `exam_blueprint` is still stored on the existing
  map (do not call `createMap` again — it would reset the map).
- Do **not** rename or restructure existing sections - the map is shared across goals (Strategy
  C in SKILL.md), and restructuring would disrupt concepts/progress tied to other goals.
- Instead, order higher-weighted exam-domain concepts earlier within sections so they are
  covered first — this prioritizes them without touching section names.
- Pretest (below) is still offered if `pretest_offered` is not already `true` on the map.
- `exam_blueprint` is per-map (not per-goal). If the map already has an `exam_blueprint` from
  a previous exam goal, the new research overwrites it. Tell the user: "Updating the exam
  blueprint to [new exam] — the previous [old exam] blueprint will be replaced."

## Pretest

Offered once, right after exam-mode is confirmed (both brand-new and existing-map cases), always
skippable. Set `pretest_offered: true` in map frontmatter immediately when the offer is shown —
whether accepted, declined, or abandoned — so it is never re-shown on returning sessions.

### Plan and confirm

Derive the plan and ask in a single message (no two-step confirmation):

**Step 1 — Normalize weights.** Web-researched weights may not sum to 100% due to rounding.
Normalize before applying the formula:

```text
normalized_pct = (domain.weight_pct / sum_of_all_weight_pcts) × 100
```

**Step 2 — Allocate per domain:**

```text
per_domain = round(total_questions × (normalized_pct / 100) × 0.25), floor 2
```

**Step 3 — Apply cap.** If the sum exceeds 20, scale down proportionally: multiply each
allocation by `20 / sum`, re-apply floor 2, then adjust the largest domain by ±1 to reach
exactly 20.

**Step 4 — Mark skipped domains.** Resolve each domain's effective `question_styles` array:
use `domain.question_styles` if present, otherwise fall back to `format.question_styles`
(applying the backwards-compat coercion rule from Blueprint Schema if needed). A domain is
skipped when its resolved array **contains** `hands-on` or `performance`. If every domain is
skipped, skip the pretest entirely:

> "This exam is entirely hands-on — a text-based pretest wouldn't give a useful signal. Skipping the diagnostic."

Show the plan and ask in one message:

```text
Exam: AWS SAA-C03  (65 questions · 130 min · 72% passing)

Quick diagnostic — want to see where you're starting from?
  Design Resilient Architectures   (30%)  → 5 questions
  Design High-Performing Arch.     (28%)  → 5 questions
  Design Secure Architectures      (24%)  → 4 questions
  Design Cost-Optimized Arch.      (18%)  → 3 questions
Total: 17 questions  [y/n]
```

**Fallback (no blueprint / tier 3):** 8–12 questions. If domain names are known, distribute
evenly and use the same table format. If no domain names are known, omit the table:

```text
Quick diagnostic — want to see where you're starting from?
~10 questions  [y/n]
```

### Delivery

Ask **one question at a time** — assessment style (not Socratic/predictive). Write questions
that test existing knowledge: "Which of these correctly describes X?" or "In scenario Y, what
is the right approach?" Wait for the answer before showing the next. After each answer,
acknowledge briefly (correct/incorrect + one-line explanation), then continue.

**Question formats:** Use the question formats from the domain's resolved `question_styles`
array (see Step 4). Supported formats:

| Format | Structure |
|---|---|
| `multiple-choice` | One correct answer, 3–4 options. Distractor options must be plausible — common misconceptions, not obviously wrong choices. |
| `ordering` | Present 3–5 items; user orders them (e.g. steps in a workflow, rule precedence). State the ordering criterion clearly in the question stem. |
| `matching` | Two columns of 3–5 items each; user pairs them. Both columns must have the same count — no leftover items. |

**Format distribution:** For each domain's question allocation, assign at least one question per
available format first (round-robin in order: multiple-choice → ordering → matching). Distribute
remaining questions proportionally — if two formats remain and three questions are left, assign 2
to the first and 1 to the second (largest remainder). If a domain's total allocation is smaller
than the number of available formats, drop the least-common format for that domain only.

**Difficulty calibration:** Write questions at the difficulty level of the real exam:
- Prefer scenario-based stems over definition recall: "A company needs to… which approach?"
  over "What is X?"
- Use domain-specific terminology as it appears in the official objectives (not simplified
  paraphrases).
- For ordering questions: use real workflow steps or architectural decision sequences — not
  trivially obvious orderings.
- For matching questions: use near-synonyms or functionally related pairs that require genuine
  discrimination (e.g. RAG vs. fine-tuning vs. prompt engineering use cases).
- Distractors in multiple-choice should reflect common exam traps (plausible AWS service names
  that don't apply, or correct concepts applied to the wrong context).

**If the user abandons mid-pretest:** stop immediately, skip the summary. The
`pretest_offered: true` flag is already set, so the pretest is not re-offered next session.

### Effect: informational only

After all questions, produce a one-time summary:

> "Rough starting level: Intermediate. Strong on Resilient Architectures and Security, weaker on Cost Optimization."

Do **not** change any concept's `status`, reorder anything, or skip any activity — every
concept still runs the full Learn → Synthesize → Practice → Calibrate journey regardless of
pretest performance. Do not persist the result — it is a session-only message.

## Mock Test

Offered once mastery reaches ≥80% of concepts in the map. Repeatable — the learner may run it multiple times.

### Trigger

After every Calibrate activity, check the mastery threshold against all concepts in the map.
A concept with `status: mastered` counts.

```text
mastered_count / filtered_total >= 0.80
```

On first crossing, offer:

> "You've mastered X/Y concepts (Z%). Want to run a full mock exam to check readiness? [y/n]"

If declined, offer again after every subsequent concept mastered. Never auto-run.

### Hands-on-only exams

If the blueprint's `format.question_styles` array contains only `hands-on` or `performance`
entries, and every domain's resolved `question_styles` is also entirely hands-on or
performance, skip the mock test entirely:

> "This exam is entirely hands-on — a text-based mock would give a false signal. For realistic
> practice, use [official simulator / killer.sh / a real cluster]."

Do not offer a conceptual proxy as a substitute for a full mock.

### Prompt and disclaimer

Show the exam format and a disclaimer before running:

```text
Mock Exam: AWS SAA-C03
65 questions · 130 min time limit · 72% to pass

⚠ These questions are AI-generated approximations based on the official
  blueprint — not real exam questions.

Set a timer if you want realistic conditions. Run the mock? [y/n]
```

### Running the mock

One question at a time — same options-based style as the pretest. Full question count from the
blueprint (no sampling). After each answer, acknowledge briefly (correct/incorrect + one-line
explanation), then continue without running score commentary.

**Per-domain allocation:** distribute the full question count proportionally by domain weight
(normalize weights first, same as pretest step 1):

```text
per_domain = round(total_questions × (normalized_pct / 100))
```

Adjust the largest domain by ±1 to make the total exact.

**Format distribution and difficulty calibration:** apply the same format distribution algorithm
and difficulty calibration rules as the pretest Delivery section above. The mock test uses the
full question count, so format distribution applies per-domain across that domain's full
allocation (not capped at 20).

### Result

After all questions, show the verdict and per-domain breakdown:

```text
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
| Re-offering pretest on returning session | Set `pretest_offered: true` on first offer; never re-show |
| Showing all pretest or mock test questions at once | Ask one question at a time, wait for the answer, then continue |
| Pretest questions in Socratic/predictive style | Assessment-style only ("Which is correct?") — not discovery-guided |
| Raw `weight_pct` in formula | Normalize: `weight_pct / sum_pcts × 100`, then apply `normalized_pct / 100` |
| No cap when pretest total > 20 | Scale proportionally, re-apply floor 2, adjust largest domain to hit 20 |
| Mock test before 80% mastery | Offer only at first ≥ 0.80 crossing — check after every Calibrate |
| Auto-running the mock test | Always offer it, never trigger automatically |
| Conceptual proxy mock for hands-on exams | Skip the mock; direct user to official simulator instead |
| Missing disclaimer before mock test | Show "AI-generated — not real exam questions" before first question |
| Forgetting to persist mock test results | Append each attempt to `mock_tests` in map frontmatter |
| Searching "exam questions" or "practice test" | Use "official exam guide"/"objectives"/"blueprint" — no braindumps |
| Restructuring sections on existing map | Only new maps get exam-domain names — existing maps use `priorityConcepts` |
| Sorting concepts by weight alone | Weight is a secondary key — dependencies (`requires`/`enables`) always come first |
| Retrying failed web research | Single search + single fetch, then fall through the tier chain. Exception: one additional fetch is permitted when the first result is a PDF that failed to parse — fetch the cert's main info page, then fall through if it also fails. |
