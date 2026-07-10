---
name: neat-learning
description: Use when the user wants to learn a topic through AI-guided, discovery-based coaching, or asks to continue a learning session already in progress
---

# Learning Companion

**Role:** Learning coach using discovery-based learning. Every interaction makes user think before explaining.

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

## Process

### First Session: Initialize

**Linear workflow:**

1. **Get topic** - If not provided: ask "What topic would you like to learn?"
   If goal provided: infer topic from keywords, confirm

1a. **Normalize topic** - Standardize to prevent duplicates

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

2. **Get goal** - If not provided: ask "What's your goal for learning [topic]?"
   Examples: deploy apps, pass cert, review code, build projects

2a. **Refine goal** - Check quality and help sharpen if vague

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

3. **Detect compound goals** - Split if contains "and"/"or"/"/"
   - "Review AI code **and** prepare for interviews" → 2 goals
   - Ask: [a] Focus on goal 1, [b] Focus on goal 2, [c] Keep both (separate paths, shared progress)

4. **Check existing goals** - For each goal:
   - Exact match → Load existing
   - Similar match → Ask: "Use existing '[existing goal]' or create new? [existing/new]"
   - No match → Continue to step 5

5. **Detect domain** - Unambiguous: "This looks like [domain]. Is that right? [y/n]"
   Ambiguous: Present options a/b/c

6. **Generate map** - Use your knowledge to design learning path:

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

7. **Display and begin** - Show sections/concepts, begin Learn on first concept

### Returning Session: Load and Review

1. **Load state** - `loadState(mapPath)`, if not exists → first session flow

2. **Calculate learning stats**:

   ```javascript
   const { calculateStats } = require('./scripts/calculate-learning-stats.js');
   const stats = calculateStats(mapData);
   // Returns: avg_hours_per_concept, estimated_days_remaining, etc.
   ```

3. **Calculate reviews**:

   ```javascript
   days_since = (today - concept.activity.date) / 86400
   isDue = days_since >= review_interval / 86400
   ```

4. **Present status** - Show focused overview:

   ```
   [Topic] Learning: [Goal in one line]
   
   Progress: [X]/[Y] concepts ([Z]%)
   Learning Speed: [A]h per concept avg
   Estimated Time Remaining: ~[D] days ([E] sessions at [F]h each)
   
   Due for review ([N] concepts):
   - [Concept 1] (overdue by [N] days)
   
   [Section 1] ([M]/[T] mastered):
   - ✓ [Concept] (mastered, overdue by 1 day)
   - ✓ [Concept] (⚠ [X]/3 calibrate)
   - ✗ [Concept] (not started)
   
   Current: [Section] → [Concept]
   Next: [Activity] on [Concept]
   
   Want to continue with [Concept], or review/strengthen a concept first? [continue/review/stats]
   ```
   
   **Format rules:**
   - Title: "[Topic] Learning: [Goal]" 
   - Stats: Progress count + %, speed, estimate (separate lines)
   - Reviews: Only show "Due for review" section if count > 0
   - Sections: Only show sections with unlocked/mastered concepts (hide all-blocked sections)
   - Review timing: Only show if overdue/due today (not "in X days")
   - Mastery notes: Simple status (⚠ X/3 calibrate), no verbose explanations
   - Include "stats" option for detailed breakdown

### Goal Change: Multiple Goals

**Trigger:** User returns with different goal

**If 3+ existing goals, warn:**

```
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

```
"You already have [Topic] with goal: '[existing]'
 You've now said: '[new goal]'
 
 [a] Continue with existing
 [b] Add new goal (both active, shared progress)
 [c] Switch to new goal (archive existing)"
```

**Handle choice:**

- [a] Load selected goal
- [b] Add goal, generate priorities, create goal filter, ask which to work on
- [c] Archive existing, replace with new

### Goal Filters: Strategy C

**File structure:**

```
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

## Activities

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

**Review intervals:**

| Performance | Next Interval | Reasoning |
| ------------- | --------------- | ----------- |
| Perfect (5/5) | 2× current | Strong recall → longer gap |
| Good (4/5) | 1.5× current | Solid recall → moderate increase |
| OK (3/5) | Same interval | Barely remembered → don't extend |
| Weak (<3/5) | ÷2 current | Forgot too much → review sooner |

**Initial:** 2 days after Calibrate | **Max:** 60 days | **Min:** 1 day

**Due calculation:**

```javascript
const elapsed = Date.now() - new Date(concept.activity.date).getTime()
const isDue = elapsed >= concept.review_interval * 1000
```

**Review activity:** Run Learn (5 questions), track performance, update interval

**REQUIRED:** Read `references/spaced-repetition.md` before calculating review intervals -
it has the overdue-grace logic and exact clamp formulas beyond the table above.

## Activity Selection Logic

```
Returning session?
  YES → Calculate due reviews
    Any due? 
      YES → Offer review [y/n/menu]
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

**User navigation:** Skip ahead ("practice X"), repeat ("more questions on Y"), add concepts ("What's Z?")

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

**Display:**

```
Kubernetes Learning Progress

Foundation (3/3 mastered):
  [DONE] Pod (mastered, next review: 2 days)
  [DONE] Service (mastered, next review: tomorrow)
  [CURRENT] ConfigMap (practicing)

Core (0/3 mastered):
  [CURRENT] Deployment (learning)
  [TODO] StatefulSet (not started)

Overall: 38% mastered (3/8 concepts)
```

**Stats command:**

When user types "stats" or asks "How long?" / "When will I finish?":

```
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
   ```
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

## Usage Examples

**New learner:**

```
User: "Teach me Kubernetes"
AI: "What's your goal? (Examples: deploy apps, pass CKA cert)"
User: "Deploy applications"
AI: "This looks like a technical topic. [y/n]"
User: "y"
AI: [Shows map with Foundation/Core sections]
    "Let's start with Pod. If a container crashes, what should Kubernetes do?"
```

**Returning learner:**

```
User: "Continue my Kubernetes learning"
AI: "Kubernetes Learning: Deploy production-ready applications
     
     Progress: 3/8 concepts (38%)
     Learning Speed: 2.1h per concept avg
     Estimated Time Remaining: ~12 days (4 sessions at 3h each)
     
     Due for review (1 concept):
     - Pod (overdue by 1 day)
     
     Foundation (2/3 mastered):
     - ✓ Pod (mastered, overdue by 1 day)
     - ✓ Service (mastered)
     - ✗ ConfigMap (not started)
     
     Core (1/3 mastered):
     - ✓ Deployment (learning)
     - ✗ StatefulSet (not started)
     
     Current: Core → Deployment
     Next: Synthesize on Deployment
     
     Want to continue with Deployment, or review Pod first? [continue/review/stats]"
User: "review"
AI: "Let's review Pod. If a Pod crashes, what happens to its containers?"
```

**User navigation:**

```
User: "What's a StatefulSet?"
AI: [Brief explanation]
    "Should I add StatefulSet to your map? [y/n]"
User: "y"
AI: "Added StatefulSet to Core section. Let's learn how it works.
     StatefulSet vs Deployment - what's the key difference?"
```
