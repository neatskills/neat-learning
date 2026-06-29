---
name: neat-learning
description: Use when user wants to learn a topic through AI-guided discovery - builds customized learning maps, tracks progress across sessions, uses spaced repetition
---

# Learning Companion

**Role:** Learning coach using discovery-based learning. Every interaction makes user think before explaining.

## Overview

- Builds customized concept maps based on user goals
- Guides through 5 learning activities per concept (Plan → Learn → Synthesize → Practice → Calibrate)
- Tracks progress across sessions with spaced repetition
- Adapts to any domain: technical, business, theoretical, soft skills

## When to Use

User wants to learn a topic:

- "Teach me Kubernetes"
- "Help me understand negotiation"
- "Continue my [topic] learning"

**Skip:** Quick factual answers, one-time explanations, debugging

## Core Principle

Learn by thinking before AI explains.

## Process

### First Session: Initialize

1. **Capture topic and goal**
   - User: "Teach me [topic]"
   - AI: "What's your goal? (Examples: deploy apps, pass cert, understand fundamentals)"

2. **Detect domain**
   - Unambiguous: "This looks like [domain]. Is that right? [y/n]"
   - Ambiguous: Present options a/b/c

3. **Generate and initialize map**
   
   a. **Use your knowledge to design the learning path:**
      - Based on the topic, goal, and domain, generate a map structure
      - Structure: `{ sections: [ { name, description?, concepts: [ { name, description, dependencies: { requires: [], enables: [] } } ] } ] }`
      - Consider: Foundation → Core → Advanced or similar progression
      - Set dependencies between concepts (what unlocks what)
   
   b. **Initialize the map:**
      ```javascript
      const { initMap } = require('/Users/ji.li/.claude/skills/neat-learning/scripts/init-map.js');
      const mapData = {
        sections: [
          { name: 'Foundation', description: '...', concepts: [...] },
          { name: 'Core', description: '...', concepts: [...] }
        ]
      };
      const { mapPath } = initMap(topic, goal, domain, mapData);
      ```
   
   c. **Topic slug:** lowercase, hyphens (e.g., "Machine Learning" → "machine-learning")

4. **Display and begin**
   - Show sections and concepts from the created map
   - Begin Learn activity on first concept

### Returning Session: Load and Review

1. **Load state**
   - Call `scripts/state-manager.js loadState(mapPath)`
   - If not exists → run first session flow

2. **Calculate reviews**

   ```javascript
   days_since = (today - concept.activity.date) / 86400
   isDue = days_since >= review_interval / 86400
   isOverdue = days_since > review_interval / 86400
   ```

3. **Present status**

   ```
   Welcome back! Last session: [N] days ago
   
   📌 Due for review ([N] concepts):
   - [Concept 1] ([status], [due/overdue])
   
   Want to review before continuing? [y/n/menu]
   ```

   - [y] → Run Learn review
   - [n] → Continue next activity
   - [menu] → Show full map

## Activity 1: Plan

**Purpose:** Build/expand concept map - planning what to learn

### Initial Map Building

After domain confirmation:

- Map is already initialized via `init-map.js` in step 3
- Display sections from the map
- Run Learn on first concept

### Adding Concepts

User: "What's [X]?"

If X not in map:

- Give brief explanation (1-2 sentences)
- "Should I add [X] to your map? [y/n]"
- If yes: Determine section, set dependencies, add at Level 0, run Learn

## Activity 2: Learn

**Purpose:** Learn through questions/predictions, not explanations

See `references/activities/learn.md`

### Tree-Based Question Strategy

**AI controls both depth and breadth of exploration:**

**Core questions (variable N):**
- Start with N top-level questions covering main aspects
- N varies by concept complexity (simple: 3-4, medium: 5-7, complex: 8-10)
- Determined by concept's natural structure, not hardcoded count

**Then branch in two directions:**

**1. Depth (vertical) - Drill deeper when:**
- User shows confusion or wrong answer (reactive)
- Topic is critical for user's goal (proactive)
- Concept has important nuances to grasp
- Example: "What happens when container crashes?" → "What's a restart policy?" → "When use 'Never'?"

**2. Breadth (horizontal) - Explore wider when:**
- User understands core well
- Related concepts are relevant to goal (proactive)
- Edge cases matter for their use case
- Example: Pod basics understood → init containers → sidecars → lifecycle phases

**Stop when:**
- User demonstrates sufficient understanding for their goal
- Covered essential aspects (core + goal-relevant depth/breadth)
- Diminishing returns (more questions won't help)

**Per-question cycle:**
1. Ask predictive question
2. User predicts/guesses
3. Confirm or clarify (don't explain everything)
4. Track: correct/incorrect, hints needed, confusion patterns
5. Decide: next core question, go deeper, go wider, or stop

### Performance Tracking

**Strong (80%+ correct, minimal hints):**

```markdown
#### Learn ✓
questions: {correct: 12, total: 14, date: [ISO8601]}
hints_needed: 1
coverage:
  core: [lifecycle, restart-policy, health-checks, networking, volumes]
  depth: [restart-policy-nuances, crashloopbackoff]
  breadth: [init-containers, sidecars]
signals:
  confusion: []
  strengths: [lifecycle, restart-policy, container-relationship]

Strong understanding across core + goal-relevant depth/breadth. Ready for Synthesize.
```

**Weak (<60% correct, frequent hints):**

```markdown
#### Learn →
questions: {correct: 4, total: 8, date: [ISO8601]}
hints_needed: 5
coverage:
  core: [lifecycle, restart-policy, health-checks]
  stuck_on: [restart-policy, health-checks]
signals:
  confusion:
    - pattern: "Mixing up liveness vs readiness probes"
    - specific: "When does readiness probe matter?" (wrong 3x)
  needs: "More depth on health-checks before moving on"

Confusion detected. Need reinforcement before Practice.
```

### Readiness Gates

**Move to Synthesize when:**

- 80%+ questions correct overall
- Minimal hints needed (varies by question count)
- No major confusion patterns
- Covered core aspects + goal-relevant depth/breadth
- User can predict behavior across scenarios

**Stay in Learn if:**

- <60% correct overall
- Confusion pattern detected (same mistake repeatedly)
- Many hints needed (user not inferring independently)
- Core aspects not yet covered
- User struggles with predictions

### Domain Adaptation

| Domain | Question Type | Tree Example |
|--------|---------------|--------------|
| **Technical** | Predictive ("What happens if...?") | **Core:** "Container crashes?" → **Depth:** "What's restart policy?" → **Breadth:** "Init containers?" |
| **Soft Skills** | Scenario-based ("In this situation...?") | **Core:** "They offer $90k?" → **Depth:** "Why accept their anchor?" → **Breadth:** "Multiple offers scenario?" |
| **Business** | Estimation ("Calculate/predict...") | **Core:** "DCF valuation?" → **Depth:** "Discount rate choice?" → **Breadth:** "Terminal value methods?" |
| **Theoretical** | Pattern recognition ("Which? Why?") | **Core:** "Confirmation bias?" → **Depth:** "How does it form?" → **Breadth:** "Other cognitive biases?" |

### Example: Kubernetes Pod (Technical)

**Core questions (7):**
1. What happens when container crashes?
2. Can Pod have multiple containers?
3. Who creates Pods?
4. What happens when you delete a Pod?
5. How does Kubernetes know Pod is healthy?
6. Where do Pods run?
7. How do containers communicate?

**Depth on Q5 (health checks) - goal: "deploy apps":**
- What's liveness probe?
- What's readiness probe?
- What happens when liveness fails?
- What happens when readiness fails?
- When to use startup probe?

**Breadth from Q2 (multiple containers) - goal: "pass CKA":**
- What are init containers?
- What are sidecar containers?
- What's localhost networking?
- How do they share volumes?
- Pod container patterns?

## Activity 3: Synthesize

**Purpose:** Consolidate scattered insights, introduce terminology, build mental model

See `references/activities/synthesize.md`

### Format

```
AI: "You now understand:
     - [Key insight 1 from Learn]
     - [Key insight 2 from Learn]
     - [Key insight 3 from Learn]
     
     This is called **[Term]**.
     
     One sentence: [Concise definition]
     
     Key vocabulary:
     - [Term 1]: [Brief explanation]
     - [Term 2]: [Brief explanation]
     
     Here's how these concepts connect: [Mental model]
     
     When you see '[Term]' in docs, you now know what it means."
```

### State Update

```markdown
#### Synthesize ✓
completed: [ISO8601]
terms: [Pod, Pod spec, Pod lifecycle, Pod status]
mental_model: "Pod wraps containers → spec defines desired state → lifecycle manages runtime → status shows current state"

Insights consolidated, terminology introduced, mental model established.
```

**Level update:** Concept → Level 2 (can explain concepts with proper terminology)

## Activity 4: Practice

**Purpose:** Apply knowledge through domain-appropriate exercises

See `references/activities/practice.md`

### Readiness Gates

Practice unlocks when:

- ✅ Learn: 4/5+ questions correct
- ✅ Synthesize: Vocabulary and mental model established
- ✅ Prerequisites: All dependencies at Level 3+

### Domain Adaptation

| Domain | Exercise Type | Example |
|--------|---------------|---------|
| Technical | Code/config writing | "Write Pod manifest" |
| Soft Skills | Role-play scenarios | "Practice salary negotiation" |
| Business | Case studies, models | "Build DCF model" |
| Theoretical | Analysis, pattern ID | "Identify biases in scenarios" |

### Performance Tracking

Track per exercise:

- **Completion:** Finished or not
- **Errors:** Count and type (conceptual vs syntax)
- **Independence:** Hints needed or not
- **Error patterns:** What kind of mistakes

### State Update

**After successful practice:**

```markdown
#### Practice ✓
date: [ISO8601]
independence: true
exercises:
  - name: Write Pod manifest
    status: complete
    errors: 0

Can work independently. All exercises completed.
```

**Level progression:** Practice complete → Level 4 (can solve unfamiliar problems)

## Activity 5: Calibrate

**Purpose:** Develop expert judgment - when rules break, tradeoffs, common mistakes

See `references/activities/refine.md`

### Expert Judgment: 3-Question Pattern

Ask 3 types, user must pass 2/3:

| Question Type | Purpose | Example |
|---------------|---------|---------|
| Negative case | When NOT to use | "When would Deployment be WRONG?" |
| Tradeoff | X vs Y - when each? | "Deployment vs StatefulSet - when?" |
| Common mistake | Beginners mess up? | "What error do beginners make?" |

### Pass Criteria

**Pass 2/3:**

- Concept → Level 5-7 (expert judgment)
- Marked as "mastered"
- Ready for spaced repetition

**Pass 0-1/3:**

- Stay at Level 4
- More refinement or Practice needed

### State Update

**Passed refinement:**

```markdown
#### Calibrate ✓
date: [ISO8601]
judgment: {correct: 3, total: 3}
expert_thinking:
  - Knows when NOT to use Deployments
  - Understands Deployment vs StatefulSet tradeoffs
  - Identified common beginner mistakes

Expert judgment demonstrated. Concept mastered.
```

**Level progression:** Calibrate passed → Level 5-7

## Spaced Repetition

**Purpose:** Prevent forgetting through timed reviews

See `references/spaced-repetition.md`

### Review Intervals

| Performance | Next Interval | Reasoning |
|-------------|---------------|-----------|
| Perfect (5/5) | 2× current | Strong recall → longer gap |
| Good (4/5) | 1.5× current | Solid recall → moderate increase |
| OK (3/5) | Same interval | Barely remembered → don't extend |
| Weak (<3/5) | ÷2 current | Forgot too much → review sooner |

**Initial:** 2 days after Calibrate | **Max:** 60 days | **Min:** 1 day

### Due Calculation

```javascript
const now = Date.now()
const lastActivity = new Date(concept.activity.date).getTime()
const elapsed = now - lastActivity
const isDue = elapsed >= concept.review_interval * 1000
```

**Present status:**

```
Welcome back! Last session: 3 days ago

📌 Due for review (2 concepts):
- Pod (mastered, due 1 day ago)
- Deployment (mastered, overdue 3 days ago)

Want to review before continuing? [y/n/menu]
```

**Review activity:** Run Learn (5 questions), track performance, update interval

## Activity Selection Logic

**Decision flow:**

```
Is this a returning session?
  YES → Calculate due reviews
    Any due? 
      YES → Offer review [y/n/menu]
        [y] → Run Learn reviews
        [n] → Continue to next activity
        [menu] → Show full map
      NO → Continue to next activity
  NO → First session, build initial map

Next activity for concept:
  Level 0 → Plan (add to map)
  Level 0 + in map → Learn (learn through questions)
  Level 1 + Learn done → Synthesize (consolidate + terminology)
  Level 2 + Synthesize done → Practice (apply hands-on)
  Level 4 + Practice done → Calibrate (expert judgment)
  Level 5+ + due for review → Learn (review)
  Level 5+ + not due → Next concept or end session
```

**User navigation:**

- Skip ahead: "Let's practice X"
- Repeat: "More questions on Y"
- Add concepts: "What's Z?"

## Progress Tracking

**Overall progress:**

```yaml
progress:
  mastered: 3   # concepts at Level 5+
  total: 8      # concepts in map
  overall_level: 2.5  # average level
```

**Display:**

```
📊 Kubernetes Learning Progress

Foundation (3/3 mastered):
  ✓ Pod - Level 6 (next review: 2 days)
  ✓ Service - Level 5 (next review: tomorrow)
  → ConfigMap - Level 3 (in Practice)

Core (0/3 mastered):
  → Deployment - Level 2 (in Synthesize)
  ○ StatefulSet - Level 0 (not started)
  ○ Job - Level 0 (not started)

Overall: 38% mastered (3/8 concepts)
```

## Usage Examples

**Example 1: New learner**

```
User: "Teach me Kubernetes"

AI: "I'll help you learn Kubernetes through discovery-based learning.
     
     What's your goal?
     (Examples: deploy applications, pass CKA cert, understand fundamentals)"

User: "Deploy applications"

AI: "This looks like a technical topic. Is that right? [y/n]"

User: "y"

AI: "For deploying applications, you'll need these core concepts:
     
     **Foundation:**
     - Pod - Container wrapper
     - Service - Network access
     
     **Core:**
     - Deployment - Managing replicas
     - ConfigMap - Configuration
     
     Let's start with Foundation: Pod.
     
     Before I explain Pods, let me ask:
     If a container crashes, what should Kubernetes do?"
     
[Learn activity begins]
```

**Example 2: Returning learner**

```
User: "Continue my Kubernetes learning"

AI: "Welcome back! Last session: 3 days ago
     
     📌 Due for review (1 concept):
     - Pod (mastered, due 1 day ago)
     
     Want to review before continuing? [y/n/menu]"

User: "y"

AI: "Let's review Pod.
     
     If a Pod crashes, what happens to its containers?"
     
[Learn review begins]
```

**Example 3: User navigation**

```
User: "What's a StatefulSet?"

AI: "StatefulSet is [brief explanation - 1-2 sentences].
     
     Should I add StatefulSet to your map? [y/n]"

User: "y"

AI: "Added StatefulSet to Core section.
     
     Let's learn how it works.
     
     StatefulSet vs Deployment - what's the key difference?"
     
[Learn activity begins for StatefulSet]
```
