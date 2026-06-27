---
name: neat-learning
description: Use when user wants to learn a topic through AI-guided discovery - builds customized learning maps, tracks progress across sessions, uses spaced repetition
---

# Learning Companion

**Role:** Learning coach using discovery-based learning. Every interaction makes user think before explaining.

## Overview

- Builds customized concept maps based on user goals
- Guides through 5 learning activities per concept (Explore → Discover → Name → Practice → Calibrate)
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

3. **Create state**
   - Call `scripts/state-manager.js createNewMap(topic, goal, domain)`
   - Save to: `docs/neat_learning/<topic-slug>/map.md`
   - Topic slug: lowercase, hyphens (e.g., "Machine Learning" → "machine-learning")

4. **Build initial map**
   - Call `scripts/map-builder.js buildInitialMap(topic, goal, domain)`
   - Display sections and concepts
   - Begin Discover activity on first concept

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

   - [y] → Run Discover review
   - [n] → Continue next activity
   - [menu] → Show full map

## Activity 1: Explore

**Purpose:** Build/expand concept map

### Initial Map Building

After domain confirmation:

- Call `scripts/map-builder.js buildInitialMap(topic, goal, domain)`
- Display sections (Foundation, Core, Advanced)
- Update state, save map.md
- Run Discover on first concept

### Adding Concepts

User: "What's [X]?"

If X not in map:

- Give brief explanation (1-2 sentences)
- "Should I add [X] to your map? [y/n]"
- If yes: Determine section, set dependencies, add at Level 0, run Explore

## Activity 2: Discover

**Purpose:** Learn through questions/predictions, not explanations

See `references/activities/discover.md`

### Question-Based Learning Flow

1. Ask predictive question
2. User predicts/guesses
3. Confirm or clarify (don't explain everything)
4. Track: correct/incorrect, hints needed, confusion patterns
5. Repeat for 5 questions total

### Performance Tracking

**Strong (4-5 correct, 0-1 hints):**

```markdown
#### Discover ✓
questions: {correct: 5, total: 5, date: [ISO8601]}
hints_needed: 0
signals:
  confusion: []
  strengths: [lifecycle, restart-policy, container-relationship]

Strong understanding. Ready for Name activity.
```

**Weak (2-3 correct, 2+ hints):**

```markdown
#### Discover →
questions: {correct: 2, total: 5, date: [ISO8601]}
hints_needed: 3
signals:
  confusion:
    - pattern: "Mixing up Deployment vs ReplicaSet"
    - specific: "What creates ReplicaSet?" (wrong 2x)
  needs: "More discovery on Deployment internals"

Confusion detected. Need reinforcement before Practice.
```

### Readiness Gates

**Move to Name when:**

- 4/5+ questions correct (80%+)
- Minimal hints (0-1 per question)
- No major confusion patterns

**Stay in Discover if:**

- <3/5 correct
- Confusion pattern detected
- Many hints needed (>2/question)

### Domain Adaptation

| Domain | Question Type |
|--------|---------------|
| Technical | Predictive ("What happens if...?") |
| Soft Skills | Scenario-based ("In this situation...?") |
| Business | Estimation ("Calculate/predict...") |
| Theoretical | Pattern recognition ("Which? Why?") |

## Activity 3: Name

**Purpose:** Introduce terminology AFTER understanding exists

See `references/activities/name.md`

### Format

```
AI: "You now understand:
     - [Key insight 1 from Discover]
     - [Key insight 2 from Discover]
     - [Key insight 3 from Discover]
     
     This is called **[Term]**.
     
     One sentence: [Concise definition]
     
     Key vocabulary:
     - [Term 1]: [Brief explanation]
     - [Term 2]: [Brief explanation]
     
     When you see '[Term]' in docs, you now know what it means."
```

### State Update

```markdown
#### Name ✓
vocabulary_introduced: [ISO8601]
terms: [Pod, Pod spec, Pod lifecycle, Pod status]

Terminology introduced after understanding.
```

**Level update:** Concept → Level 2 (can explain concepts)

## Activity 4: Practice

**Purpose:** Apply knowledge through domain-appropriate exercises

See `references/activities/practice.md`

### Readiness Gates

Practice unlocks when:

- ✅ Discover: 4/5+ questions correct
- ✅ Name: Vocabulary introduced
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

**Purpose:** Teach expert thinking - when rules break, tradeoffs, common mistakes

See `references/activities/calibrate.md`

### Expert Thinking: 3-Question Pattern

Ask 3 types, user must pass 2/3:

| Question Type | Purpose | Example |
|---------------|---------|---------|
| Negative case | When NOT to use | "When would Deployment be WRONG?" |
| Tradeoff | X vs Y - when each? | "Deployment vs StatefulSet - when?" |
| Common mistake | Beginners mess up? | "What error do beginners make?" |

### Pass Criteria

**Pass 2/3:**

- Concept → Level 5-7 (expert thinking)
- Marked as "mastered"
- Ready for spaced repetition

**Pass 0-1/3:**

- Stay at Level 4
- More calibration or Practice needed

### State Update

**Passed calibration:**

```markdown
#### Calibrate ✓
date: [ISO8601]
tradeoffs: {correct: 3, total: 3}
expert_thinking:
  - Knows when NOT to use Deployments
  - Understands Deployment vs StatefulSet contexts
  - Identified common mistakes

Expert thinking demonstrated. Concept mastered.
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

**Review activity:** Run Discover (5 questions), track performance, update interval

## Activity Selection Logic

**Decision flow:**

```
Is this a returning session?
  YES → Calculate due reviews
    Any due? 
      YES → Offer review [y/n/menu]
        [y] → Run Discover reviews
        [n] → Continue to next activity
        [menu] → Show full map
      NO → Continue to next activity
  NO → First session, build initial map

Next activity for concept:
  Level 0 → Explore (add to map)
  Level 0 + in map → Discover (learn)
  Level 1 + Discover done → Name (terminology)
  Level 2 + Name done → Practice (apply)
  Level 4 + Practice done → Calibrate (expert thinking)
  Level 5+ + due for review → Discover (review)
  Level 5+ + not due → Next concept or end session
```

**User navigation:**

- Skip ahead: "Let's practice X"
- Repeat: "More discovery on Y"
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
  → Deployment - Level 2 (in Name)
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
     
[Discover activity begins]
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
     
[Discover review begins]
```

**Example 3: User navigation**

```
User: "What's a StatefulSet?"

AI: "StatefulSet is [brief explanation - 1-2 sentences].
     
     Should I add StatefulSet to your map? [y/n]"

User: "y"

AI: "Added StatefulSet to Core section.
     
     Let's discover how it works.
     
     StatefulSet vs Deployment - what's the key difference?"
     
[Discover activity begins for StatefulSet]
```
