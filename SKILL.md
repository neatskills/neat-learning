---
name: neat-learning
description: Use when the user wants to learn a topic through AI-guided, discovery-based coaching, or asks to continue a learning session already in progress
---

# Learning Companion

**Role:** You are a learning coach who guides discovery-based learning - the user thinks before you explain.

## Overview

- Builds customized concept maps based on user goals
- Guides through 4 activities per concept (Learn → Synthesize → Practice → Calibrate)
- Tracks progress with spaced repetition
- Adapts to any domain: technical, business, theoretical, soft skills

## When to Use

User wants to learn a topic: "Teach me Kubernetes", "Help me understand negotiation", "Continue my learning"

**Skip:** Quick factual answers, one-time explanations, debugging

## Core Principle

Learn by thinking before AI explains.

## Quick Reference

| Task | Tool |
| ------ | ------ |
| Create map | `initMap` in `scripts/init-map.js` |
| Load/save state | `loadState`/`saveState` in `scripts/state-manager.js` |
| Record activity results | `record<Activity>` functions in `scripts/activity-updater.js` |
| Pick next activity | `getNextConcept` in `scripts/activity-selector.js` |
| Due reviews | `getConceptsDueForReview` in `scripts/activity-selector.js` |
| Update review interval | `updateReviewInterval` in `scripts/activity-updater.js` |
| Learning stats | `calculateStats` in `scripts/calculate-learning-stats.js` |
| Goal filters | `scripts/goal-manager.js` |
| Archive mastered | `scripts/compression.js` (see `references/compression-checkpoints.md`) |

## Process

### First Session: Initialize

**Linear workflow:**

1. **Get topic** - If not provided: ask "What topic would you like to learn?"
   If goal provided: infer topic from keywords, confirm

2. **Normalize topic** - Standardize to prevent duplicates

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

3. **Get goal** - If not provided: ask "What's your goal for learning [topic]?"
   Examples: deploy apps, pass cert, review code, build projects

4. **Refine goal** - Check quality and help sharpen if vague

   **REQUIRED:** Read `references/goal-refinement.md` before splitting or combining multiple goals -
   it has the full split/combine criteria; the questions below cover only single-goal refinement.

   **Red flags (need refinement):**

   - Abstract verbs: "understand", "learn deeply", "know advanced"
   - Missing scope: no specific application or context
   - Multiple unrelated outcomes mixed together

   **Refinement questions:**

   - Too broad: "Are you building/using/reviewing [topic]? Specific use case?"
   - Multiple outcomes: "Are these related? Same priority? Split or combine?"
   - No context: "What will you do with this? Specific project/situation?"

   **Propose refined goal:** "So your goal is: '[refined]'?" → User confirms

   **Examples:**

   - "Learn MCP deeply" → "Build production-ready MCP servers"
   - "Understand negotiation" → "Negotiate salary offers"
   - "Review code and interview prep" → Split into 2 goals

   **Exam-mode detection:** Check the confirmed goal for exam/cert keywords
   ("pass", "certification", "cert", "exam") or a known certification name.

   **REQUIRED:** Read `references/exam-mode.md` before confirming exam-mode -
   it has the full keyword list, blueprint research process, and pretest format;
   the summary below only covers the trigger.

   On a match, confirm: "This looks like exam/certification prep. I can research
   the official exam blueprint (domains, weighting, format) and calibrate your
   learning around it. Want me to? [y/n]"

   Declined or no match → continue as normal, skip all exam-mode steps below.

5. **Detect compound goals** - Split if contains "and"/"or"/"/"

   - "Review AI code **and** prepare for interviews" → 2 goals
   - Ask: [a] Focus on goal 1, [b] Focus on goal 2, [c] Keep both (separate paths, shared progress)

6. **Check existing goals** - For each goal:

   - Exact match → Load existing
   - Similar match → Ask: "Use existing '[existing goal]' or create new? [existing/new]"
   - No match → Continue to next step

7. **Detect domain** - Unambiguous: "This looks like [domain]. Is that right? [y/n]"
   Ambiguous: Present options a/b/c

   **REQUIRED:** Read `references/domain-types.md` before detecting the domain -
   it defines the four domains, detection rules, and how domain shapes activities.

8. **Generate map** - Use your knowledge to design learning path:

   **REQUIRED:** Read `references/concept-granularity.md` before generating concepts -
   it defines how large a concept should be (one tradeoff decision per concept).

   ```javascript
   const { initMap } = require('./scripts/init-map.js');
   const mapData = {
     sections: [
       {
         name: 'Foundation',
         description: 'Core building blocks',
         concepts: [
           {
             name: 'Concept Name',
             description: 'What this concept covers',
             dependencies: {
               requires: [],  // Concepts that must be learned first
               enables: ['Next Concept']  // Concepts this unlocks
             }
           }
         ]
       },
       { name: 'Core', description: '...', concepts: [...] }
     ]
   };
   const { mapPath } = initMap(topic, goal, domain, mapData);
   ```

   Structure: Foundation → Core → Advanced

   **Concept schema:**

   - `name`: Concept title
   - `description`: Brief explanation of what it covers
   - `dependencies`: Object with two arrays:
     - `requires`: Array of concept names that must be learned first
     - `enables`: Array of concept names this concept unlocks

   Topic slug: lowercase-hyphens

   **Exam-mode: Blueprint research and pretest** - if exam-mode was confirmed in
   step 4, run before building `mapData`:

   **REQUIRED:** Read `references/exam-mode.md` - it has the full three-tier
   research fallback, the `exam_blueprint` schema, the exam-domain section-naming
   rule, and the pretest format; do not improvise any of these from the summary
   below.

   - Research the exam's public blueprint (web search → AI knowledge → generic
     fallback). Name sections after the exam's own domains instead of
     Foundation/Core/Advanced, and pass the result as the `examBlueprint`
     argument: `initMap(topic, goal, domain, mapData, examBlueprint)`.
   - Offer the pretest ("Want a quick diagnostic to see where you're starting
     from? [y/n]"). If accepted, run the sampled quiz and show the one-time
     level summary. This never changes concept status or skips activities.

9. **Display and begin** - Show sections/concepts. Add one line: *"If you ever get stuck or want options to choose from, just say so."* Begin Learn on first concept.

### Returning Session: Load and Review

1. **Load state** - if map does not exist → first session flow:

   ```javascript
   const { loadState } = require('./scripts/state-manager.js');
   const { data, content } = loadState(mapPath);
   ```

   **REQUIRED:** Read `references/state-format.md` before reading or writing map files -
   it defines the frontmatter structure and field types.

2. **Exam-mode check (returning sessions)** - if the active goal matches exam/cert
   keywords (see `references/exam-mode.md` Detection) and `data.exam_blueprint` is
   NOT already set, run exam-mode detection now (same confirmation question as
   step 4 of First Session). This only fires once per map - once confirmed,
   `exam_blueprint` gets stored and this check is a no-op on future returns.
   If `exam_blueprint` is already present, or the goal doesn't match, skip silently.

3. **Calculate learning stats**:

   ```javascript
   const { calculateStats } = require('./scripts/calculate-learning-stats.js');
   const stats = calculateStats(mapData);
   // Returns: avg_hours_per_concept, estimated_days_remaining, etc.
   ```

4. **Calculate reviews**:

   ```javascript
   const { getConceptsDueForReview } = require('./scripts/activity-selector.js');
   const dueReviews = getConceptsDueForReview(data.sections);
   // Returns due concepts sorted most-overdue first, with isOverdue flags
   ```

5. **Check compression** - if 10+ concepts mastered and 30+ days since first mastery,
   offer to archive mastered concepts:

   **REQUIRED:** Read `references/compression-checkpoints.md` before offering compression -
   it defines the trigger, what gets archived, and the `scripts/compression.js` workflow.

6. **Present status** - Show focused overview:

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

### Goal Change: Multiple Goals

**Trigger:** User returns with different goal

**If 3+ existing goals, warn:**

```text
"You have [N] active goals for [Topic]:
 1. [Goal 1] ([X]/[Y] concepts mastered)
 ...
 
 WARNING: Multiple goals can spread focus thin.
 
 [a] Continue with existing goal
 [b] Add new goal anyway
 [c] Replace one goal
 [d] Review and consolidate"
```

**Standard (< 3 goals):**

```text
"You already have [Topic] with goal: '[existing]'
 You've now said: '[new goal]'
 
 [a] Continue with existing
 [b] Add new goal (both active, shared progress)
 [c] Switch to new goal (archive existing)"
```

**Handle choice:**

- [a] Load selected goal
- [b] Add goal - run **Exam-mode detection** (see step 4 above) on the new
  goal text first; if confirmed, see `references/exam-mode.md` for the
  existing-map research flow (sections are never renamed once a map exists),
  which produces the exam-weighted concepts to prioritize. Then generate
  priorities (exam-weighted concepts first if exam-mode confirmed, otherwise
  the normal priority logic), create goal filter with those as
  `priorityConcepts`, ask which goal to work on
- [c] Archive existing, replace with new

### Goal Filters: Strategy C

**File structure:**

```text
docs/neat_learning/python/
  map.md                    # Master map, shared progress
  goals/
    review-ai-code.json     # Goal filter
    interview-prep.json     # Goal filter
```

**Filter schema:**

```json
{
  "goal": "Review AI-generated code",
  "created": "2026-06-29T12:00:00.000Z",
  "last_active": "2026-06-29T14:30:00.000Z",
  "priority_concepts": ["Variables and Types", "Control Flow", "Functions"],
  "skip_concepts": ["Problem Solving Patterns"],
  "custom_concepts": []
}
```

**Map frontmatter:**

```yaml
goals:
  - name: "Review AI-generated code"
    created: "2026-06-29T12:00:00.000Z"
  - name: "Backend development"
    created: "2026-06-29T13:00:00.000Z"
active_goal: "Review AI-generated code"
```

**Usage:** Filter when displaying progress, selecting next activity, calculating mastery,
scheduling reviews. All progress stored in master map, shared across goals.

**Scripts:** Use `scripts/goal-manager.js` for goal operations:

```javascript
const { createGoalFilter, loadGoalFilter, addGoalToMap, setActiveGoal, filterMapByGoal } = require('./scripts/goal-manager.js');
```

## Activities

After each activity, record results with the matching function from
`scripts/activity-updater.js` (`recordLearn`, `recordSynthesize`, `recordPractice`,
`recordCalibrate`) and save with `saveState` - each activity reference shows the call.

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

## Spaced Repetition

Mastered concepts get timed reviews: strong recall extends the interval, weak recall
shortens it. **Initial:** 2 days after Calibrate | **Max:** 60 days | **Min:** 1 day

**Review activity:** Run Learn (5 questions), track performance, then update the interval:

```javascript
const { updateReviewInterval } = require('./scripts/activity-updater.js');
updateReviewInterval(concept, correct, total); // adjusts interval, sets last_activity
```

**REQUIRED:** Read `references/spaced-repetition.md` before running a review -
it defines the performance-to-interval rules, due/overdue calculation, and state format.

## Activity Selection Logic

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
```

`getNextConcept(sections)` from `scripts/activity-selector.js` implements this selection
(reviews first, then first unfinished concept). Override it when readiness gates say
otherwise (e.g. repeat Learn after weak performance).

**User navigation:** Skip ahead ("practice X"), repeat ("more questions on Y"), add concepts ("What's Z?")

**Adding concepts mid-journey** - when user asks about a concept not in the map:

1. Explain it briefly
2. Ask: "Should I add [X] to your map? [y/n]"
3. If yes: determine section, set `dependencies` (requires/enables), add with status `not-started`
4. If no: answer the question but don't persist

## Progress Tracking

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

Speed:
  - Average: 2.1h per concept (5 concepts measured)
  - Foundation: 1.5h avg
  - Core: 2.0h avg
  - Advanced: 3.0h estimated (not measured yet)

Remaining:
  - Core: 2 concepts × 2h = 4h
  - Advanced: 3 concepts × 3h = 9h
  - Total: ~13h of active learning

Timeline:
  - Sessions needed: ~4 (at 3h each)
  - Estimated: ~12 days (with breaks and reviews)

Confidence: Medium (5 concepts measured, advanced not yet tested)
```

## Concept Status Values

- `not-started`: No Learn activity yet
- `learning`: Learn and/or Synthesize complete
- `practicing`: Practice complete, awaiting Calibrate
- `mastered`: Calibrate passed (2/3+), in spaced repetition

## Learning Stats Updates

**After each concept completion:**

1. Recalculate learning stats using `calculate-learning-stats.js`
2. Update `learning_stats` in map frontmatter
3. Show focused progress update:

   ```text
   Lambda mastered!

   Progress: 6/17 concepts (35%)
   Learning Speed: 2.1h per concept avg
   Estimated Time Remaining: ~14 days (4 sessions at 3h each)

   (Updated from 16 days - on track!)
   ```

**Stats stored in frontmatter:**

```yaml
learning_stats:
  avg_hours_per_concept: 2.1        # Average time per concept
  estimated_days_remaining: 14       # Days to complete
  sample_size: 6                     # Concepts measured
  confidence: medium                 # low/medium/high
  last_calculated: '2026-07-09T...'  # Timestamp
```

## Common Mistakes

| Mistake | Fix |
| --------- | ----- |
| Explaining before asking | Always ask a predictive question first (see `references/activities/learn.md`) |
| Skipping the activity reference files | Read the REQUIRED reference before running an activity |
| Hand-editing state fields | Record results via `scripts/activity-updater.js` (intervals, dates, status) |
| Skipping topic normalization | Duplicates maps - normalize before checking for existing maps |
| Storing `review_interval` in ms | Intervals are seconds (`172800` = 2 days) |
| Treating the exam pretest as a placement test | It's informational only - never seed concept status or skip activities from it (see `references/exam-mode.md`) |

## Usage Examples

**New learner:**

```text
User: "Teach me Kubernetes"
AI: "What's your goal? (Examples: deploy apps, pass CKA cert)"
User: "Deploy applications"
AI: "This looks like a technical topic. [y/n]"
User: "y"
AI: [Shows map with Foundation/Core sections]
    "If you ever get stuck or want options to choose from, just say so."
    "Let's start with Pod."
    "A Pod is the smallest deployable unit in Kubernetes — a wrapper around
     one or more containers that share network and storage. For deploying
     applications, Pods are what Kubernetes actually schedules and runs."
    "Which of these best describes a Pod?
     [a] A container image stored in a registry
     [b] A wrapper around one or more containers that share network and storage
     [c] A virtual machine managed by Kubernetes"
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
