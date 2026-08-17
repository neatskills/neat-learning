---
name: neat-learning
description: Use when the user wants to learn a topic through AI-guided, discovery-based coaching, or asks to continue a learning session already in progress — structured concept-map coaching, not one-off Q&A
---

# Learning Companion

**Role:** You are a learning coach who guides discovery-based learning through structured questioning — producing a personalized concept map the user masters concept by concept.

## Overview

Structure of this run: topic + goal → First Session (build concept map) or Returning Session (resume) → Learn → Synthesize → Practice → Calibrate per concept → adapts to any domain (technical, business, theoretical, soft skills).

## When to Use

Run when the user wants to learn a topic through guided discovery (e.g. "Teach me Kubernetes", "Help me understand negotiation") or continue an existing learning session. Not for quick factual answers or one-time explanations — answer directly. Not for debugging — use superpowers:systematic-debugging for that.

## Configuration

**Core Principle:** Learn by thinking before AI explains.

**Quick Reference:**

| Task | Tool |
| ------ | ------ |
| Create map | `createMap` in `scripts/map.js` |
| Load/inspect state | `loadMap` in `scripts/map.js` |
| Record activity result | `recordActivity` in `scripts/map.js` |
| Add concept mid-journey | `addConcept` in `scripts/map.js` |
| Session status | `getStatus` in `scripts/map.js` |
| End session | `endSession` in `scripts/map.js` |

## Phase 1: First Session — Initialize

**Linear workflow:**

**Step 1 — Get topic:** If not provided: ask "What topic would you like to learn?"
If goal provided: infer topic from keywords, confirm

**Step 2 — Normalize topic:** Standardize to prevent duplicates

**REQUIRED:** Read `references/topic-normalization.md` before finalizing the normalized name -
it has the full alias registry and edge-case rules; the transformations below cover only the common cases.

**Apply transformations:**

- Lowercase with hyphens: "Model Context Protocol" → `model-context-protocol`
- Check aliases: "MCP" → `model-context-protocol`, "k8s" → `kubernetes`
- Strip versions unless explicit: "Python 3" → `python`
- Singular form: "negotiations" → `negotiation`

**Check for existing map:** `docs/neat_learning/{normalized-topic}/map.md`

- If exists: load state, offer to continue
- If not: confirm canonical name with user, proceed

**Confirm:** "I'll help you learn [Canonical Name]. Is that correct? [y/n]"

If [n]: ask "What would you like to call this topic?" and use their answer as the canonical display name, keeping the normalized slug for file paths.

**Step 3 — Get goal:** If not provided: ask "What's your goal for learning [topic]?"
Examples: deploy apps, pass cert, review code, build projects

**Step 4 — Refine goal:** Check quality and help sharpen if vague

**REQUIRED:** Read `references/goal-refinement.md` before splitting or combining multiple goals -
it has the full split/combine criteria; the questions below cover only single-goal refinement.

**Red flags (need refinement):**

- Abstract verbs: "understand", "learn deeply", "know advanced"
- Missing scope: no specific application or context

**Refinement questions:**

- Too broad: "Are you building/using/reviewing [topic]? Specific use case?"
- No context: "What will you do with this? Specific project/situation?"

**Propose refined goal:** "So your goal is: '[refined]'?" → User confirms

**Examples:**

- "Learn MCP deeply" → "Build production-ready MCP servers"
- "Understand negotiation" → "Negotiate salary offers"
- "Review code and interview prep" → Split into 2 goals

**Exam-mode detection:** Check the confirmed goal for exam/cert keywords or a known
certification name.

**REQUIRED:** Read `references/exam-mode.md` before confirming exam-mode - it has the
full keyword list, confirm prompt, blueprint research process, pretest format, and mock
test trigger; all behavioral details are there.

On a keyword/cert match, confirm per `references/exam-mode.md` (Detection section).

Declined or no match → continue as normal, skip all exam-mode steps below.

**Step 5 — Detect compound goals:** Split if contains "and"/"or"/"/"

- "Review AI code **and** prepare for interviews" → 2 goals
- Ask: [a] Focus on goal 1, [b] Focus on goal 2, [c] Keep both (separate paths, shared progress)

**Step 6 — Check existing goals:** For each goal:

- Exact match → Load existing
- Similar match → Ask: "Use existing '[existing goal]' or create new? [existing/new]"
- No match → Continue to next step

**Step 7 — Detect domain:** Unambiguous: "This looks like [domain]. Is that right? [y/n]"
Ambiguous: Present options a/b/c

**REQUIRED:** Read `references/domain-types.md` before detecting the domain -
it defines the four domains, detection rules, and how domain shapes activities.

**Step 8 — Generate map:** Use your knowledge to design learning path:

**REQUIRED:** Read `references/concept-granularity.md` before generating concepts -
it defines how large a concept should be (one tradeoff decision per concept).

```javascript
const { createMap } = require('./scripts/map.js');
const { mapPath } = createMap(topic, goal, domain, mapData.sections);
```

Structure: Foundation → Core → Advanced. Topic slug: lowercase-hyphens

**Exam-mode: Blueprint research and pretest** - if exam-mode was confirmed in
Step 4 — Refine goal, run before building `mapData`:

**REQUIRED:** Read `references/exam-mode.md` - it has the full three-tier
research fallback, the `exam_blueprint` schema, the exam-domain section-naming
rule, and the pretest format; do not improvise any of these from the summary
below.

- Research the exam's public blueprint (web search → AI knowledge → generic
  fallback). Name sections after the exam's own domains instead of
  Foundation/Core/Advanced, seed concepts from official guide objectives when
  available, and pass the result as the `examBlueprint` argument:
  `createMap(topic, goal, domain, mapData.sections, examBlueprint)`.
- Offer the pretest ("Want a quick diagnostic to see where you're starting
  from? [y/n]"). If accepted, show the per-domain plan for confirmation, then
  ask questions one at a time and show the one-time level summary. This never
  changes concept status or skips activities.

**Step 9 — Display and begin:** Show sections/concepts. Begin Learn on first concept.

## Phase 2: Returning Session — Load and Review

**Step 1 — Normalize topic and derive path:** apply the same topic normalization as First Session
Step 2 — Normalize topic (read `references/topic-normalization.md`). Derive:
`mapPath = docs/neat_learning/{normalized-topic}/map.md`

**Step 2 — Load state:** if map does not exist → first session flow:

```javascript
const { loadMap } = require('./scripts/map.js');
const data = loadMap(mapPath);
```

**REQUIRED:** Read `references/state-format.md` before reading or writing map files -
it defines the frontmatter structure and field types.

**Step 3 — Check blueprint staleness:** if `exam_blueprint` is present in the loaded state:

**REQUIRED:** Read `references/exam-mode.md` (Blueprint Staleness section) before
checking. If `exam_blueprint.researched` is more than 6 months old, offer to re-research.

**Step 4 — Calculate learning stats:**

Stats are stored in `data.learning_stats` and recalculated automatically by
`recordActivity`. Read directly: `data.learning_stats?.avg_hours_per_concept`, etc.
`null` until the first concept completes the full activity chain.

**Step 5 — Present status:** Show focused overview:

```text
[Topic] Learning: [Goal in one line]

Progress: [X]/[Y] concepts ([Z]%)
Learning Speed: [A]h per concept avg
Estimated Time Remaining: ~[D] days ([E] sessions at [F]h each)

Due for review ([N] concepts):
- [Concept 1] (overdue by [N] days)

[Section 1] ([M]/[T] mastered):
- [x] [Concept] (mastered, overdue by 1 day)
- [x] [Concept] (! [X]/3 calibrate)
- [ ] [Concept] (not started)

Current: [Section] -> [Concept]
Next: [Activity] on [Concept]

Want to continue with [Concept], or review/strengthen a concept first? [continue/review/stats]
```

**Format rules:**

- Title: "[Topic] Learning: [Goal]"
- Stats: Progress count + %, speed, estimate (separate lines)
- Reviews: Only show "Due for review" section if count > 0
- Sections: Only show sections with unlocked/mastered concepts (hide all-blocked sections)
- Review timing: Only show if overdue/due today (not "in X days")
- Mastery notes: Simple status (! X/3 calibrate), no verbose explanations
- Markers: [x] mastered, [ ] not started, [>] in progress, ! warning
- Include "stats" option for detailed breakdown

## Phase 3: Activities

After each activity, record results with `recordActivity` from `scripts/map.js` — each activity
reference file shows the call shape.

### 1. Learn

**Purpose:** Learn through questions/predictions, not explanations

**Status update:** Concept → status: `learning`

**REQUIRED:** Read `references/activities/learn.md` before running this activity - do not
improvise the question strategy, readiness gates, or state-update format from the purpose line above.

### 2. Synthesize

**Purpose:** Consolidate insights, introduce terminology, build mental model

**Status update:** Concept → status: `learning` (stays same until Practice)

**REQUIRED:** Read `references/activities/synthesize.md` before running this activity -
it defines the format and state-update structure.

### 3. Practice

**Purpose:** Apply knowledge through domain-appropriate exercises

**Status update:** Concept → status: `practicing`

**REQUIRED:** Read `references/activities/practice.md` before running this activity -
it defines readiness gates, domain adaptation, and state-update format.

### 4. Calibrate

**Purpose:** Develop expert judgment - when rules break, tradeoffs, common mistakes

**Status update:** Concept → status: `mastered` (if passed 2/3)

**REQUIRED:** Read `references/activities/calibrate.md` before running this activity -
it defines the question pattern, pass criteria, and state-update format.

**Mock test check (exam-mode only):** After recording Calibrate results, if exam-mode is
active, check the mastery threshold. **REQUIRED:** Read `references/exam-mode.md` (Mock
Test → Trigger section) for the formula, offer text, hands-on-only guard, and persistence
schema. Never auto-run — always offer.

### Activity Selection Logic

```text
Returning session?
  YES → Calculate due reviews
    Any due?
      YES → Offer review [continue/review/stats]
      NO → Continue to next activity
  NO → First session, build initial map

Next activity for concept:
  status: not-started → Learn (questions)
  status: learning + Learn done → Synthesize (terminology)
  status: learning + Synthesize done → Practice (hands-on)
  status: practicing + Practice done → Calibrate (expert judgment)
  status: mastered + due → Learn (review)
  status: mastered + not due → Next concept or end
  end (all mastered) →
    "You've mastered all concepts! Want to add an advanced concept or start a new goal?"
```

This diagram is the authoritative source. Use `getStatus(mapPath)` to retrieve `currentConcept`
and `nextActivity` — it implements this selection logic. Override it when readiness gates say
otherwise (e.g. repeat Learn after weak performance).

**Session pacing:** Aim for 1–2 concepts per session (~30–60 min). After completing a concept or
activity block, check whether the user wants to continue or stop. Call `endSession(mapPath)` at
the end of every session to persist `last_session` and increment `total_sessions`.

**User navigation:** Skip ahead ("practice X"), repeat ("more questions on Y"), add concepts ("What's Z?")

**Adding concepts mid-journey** - when user asks about a concept not in the map:

**Step 1 — Explain:** briefly explain the concept.
**Step 2 — Ask:** "Should I add [X] to your map? [y/n]"
**Step 3 — If yes:** determine section, set `dependencies` (requires/enables), add with status `not-started`
**Step 4 — If no:** answer the question but don't persist

## Phase 4: Progress Tracking

```yaml
progress:
  mastered: 3
  total: 8
learning_stats:
  avg_hours_per_concept: 2.1
  estimated_days_remaining: 12
  sample_size: 5
  confidence: medium
  last_calculated: '2026-07-09T20:00:00.000Z'
```

**Display** (same markers as session status: [x] mastered, [>] in progress, [ ] not started):

```text
Kubernetes Learning Progress

Foundation (3/3 mastered):
  [x] Pod (mastered, next review: 2 days)
  [x] Service (mastered, next review: tomorrow)
  [>] ConfigMap (practicing)

Core (0/3 mastered):
  [>] Deployment (learning)
  [ ] StatefulSet (not started)

Overall: 38% mastered (3/8 concepts)
```

**Stats command:**

When user types "stats" or asks "How long?" / "When will I finish?":

```text
Learning Stats

Speed: 2.1h per concept avg (5 measured) · Foundation 1.5h · Core 2.0h · Advanced 3.0h est.
Remaining: Core 2×2h + Advanced 3×3h = ~13h total · ~4 sessions · ~12 days
Confidence: Medium (5 concepts measured, advanced not yet tested)
```

Done.

## Concept Status Values

- `not-started`: No Learn activity yet
- `learning`: Learn and/or Synthesize complete
- `practicing`: Practice complete, awaiting Calibrate
- `mastered`: Calibrate passed (2/3+)

## Learning Stats Updates

**After each concept completion:**

**Step 1 — Stats auto-updated:** `recordActivity` recalculates and saves `learning_stats` automatically — no separate call needed.
**Step 2 — Show:** show a focused progress update:

```text
Lambda mastered!

Progress: 6/17 concepts (35%)
Learning Speed: 2.1h per concept avg
Estimated Time Remaining: ~14 days (4 sessions at 3h each)

(Updated from 16 days - on track!)
```

Schema: same `learning_stats` block shown in Progress Tracking above.

## Common Mistakes

| Mistake | Fix |
| --------- | ----- |
| Explaining before asking | Always ask a predictive question first (see `references/activities/learn.md`) |
| Skipping the activity reference files | Read the REQUIRED reference before running an activity |
| Hand-editing state fields | Record results via `recordActivity` in `scripts/map.js` — it derives status and recalculates stats atomically |
| Skipping topic normalization | Duplicates maps - normalize before checking for existing maps |
| Treating the exam pretest as a placement test | Informational only — never seed concept status or skip activities |
| Missing the mock test trigger | After every Calibrate, check mastered ≥ 80% — offer mock test on first crossing |

## Usage Examples

**New learner:**

```text
User: "Teach me Kubernetes"
AI: "What's your goal? (Examples: deploy apps, pass CKA cert)"
User: "Deploy applications"
AI: "This looks like a technical topic. [y/n]"
User: "y"
AI: [Shows map with Foundation/Core sections, begins Learn on first concept]
    [Analogy-first orientation + options + [t] tip  |  [e] explain — see references/activities/learn.md]
```

**Returning learner:**

```text
User: "Continue my Kubernetes learning"
AI: "Kubernetes Learning: Deploy production-ready applications

     Progress: 3/8 concepts (38%)
     Learning Speed: 2.1h per concept avg
     Estimated Time Remaining: ~12 days (4 sessions at 3h each)

     Due for review (1 concept):
     - Pod (overdue by 1 day)

     Foundation (2/3 mastered):
     - [x] Pod (mastered, overdue by 1 day)
     - [x] Service (mastered)
     - [ ] ConfigMap (not started)

     Core (1/3 mastered):
     - [x] Ingress (mastered)
     - [>] Deployment (learning)
     - [ ] StatefulSet (not started)

     Current: Core -> Deployment
     Next: Synthesize on Deployment

     Want to continue with Deployment, or review Pod first? [continue/review/stats]"
User: "review"
AI: "Let's review Pod. If a Pod crashes, what happens to its containers?"
```

**User navigation:**

```text
User: "What's a StatefulSet?"
AI: [Brief explanation]
    "Should I add StatefulSet to your map? [y/n]"
User: "y"
AI: "Added StatefulSet to Core section. Let's learn how it works.
     StatefulSet vs Deployment - what's the key difference?"
```
