# Calibrate Activity

**Purpose:** Teach expert thinking patterns - when rules break, tradeoffs, common mistakes

**When to run:**
- After Practice (2+ exercises complete)
- User at Level 4+ (can apply knowledge)
- Final activity before mastery

## Expert Thinking: 3-Question Pattern

Ask 3 types of questions, user must pass 2/3:

| Question Type | Purpose | Example |
|---------------|---------|---------|
| **Negative case** | When NOT to use this | "When would Deployment be WRONG?" |
| **Tradeoff** | X vs Y - when each? | "Deployment vs StatefulSet - when to use each?" |
| **Common mistake** | What do beginners mess up? | "What subtle error do beginners make with Pods?" |

## Pass Criteria

**Pass 2/3 questions correctly:**
- Concept moves to Level 5-7 (expert thinking demonstrated)
- Concept marked as "mastered" or "calibrated"
- Ready for advanced topics or review schedule

**Pass only 0-1/3:**
- Stay at Level 4
- More calibration practice needed
- Or return to Practice for reinforcement

## Examples by Domain

### Technical (Kubernetes - Deployment)

```
AI: "You can now create and use Deployments. Let's calibrate.
     
     Question 1 (Negative case):
     When would using a Deployment be the WRONG choice?"

User: "Um... not sure?"

AI: [Hint] "Think about one-time tasks, like database migrations."

User: "Oh! If you just need to run once and exit?"

AI: [Track: correct with hint, 1/3]
    "Exactly! Deployments keep Pods running forever.
     For one-time tasks, use a Job instead.
     
     Question 2 (Tradeoff):
     Deployment vs StatefulSet - when do you use each?"

User: "Deployment for web servers, StatefulSet for databases?"

AI: [Track: correct, 2/3]
    "Right! More precisely:
     - Deployment: stateless apps (any Pod is interchangeable)
     - StatefulSet: stateful apps needing stable identity/storage
     
     Question 3 (Common mistake):
     What subtle error do beginners make with Deployments?"

User: "Setting replicas=1 and thinking it's redundant?"

AI: [Track: correct, 3/3]
    "Exactly! Replicas=1 gives automatic restart, not redundancy.
     Need replicas=3+ for high availability.
     
     [Passed 3/3 - expert thinking demonstrated]
     
     You now understand:
     - When NOT to use Deployments (one-time tasks → Job)
     - Deployment vs StatefulSet tradeoffs
     - Common beginner mistake (replicas=1)
     
     Deployment: Mastered ✓"
```

### Soft Skills (Negotiation - Anchoring)

```
AI: "You can now use anchoring effectively. Let's calibrate.
     
     Q1: When does anchoring FAIL?"

User: "When you anchor too aggressively and break trust"

AI: [Track: correct, 1/3]
    "Right! Example: $50k for a $100k car → other party walks away.
     
     Q2: Anchor first vs wait for their offer - when each?"

User: "Anchor first if you know market rate, wait if uncertain"

AI: [Track: correct, 2/3]
    "Exactly! Anchoring with bad info makes you look foolish.
     
     Q3: Common mistake beginners make with anchoring?"

User: "Anchoring on their bottom line instead of aspirational target?"

AI: [Track: correct, 3/3]
    "Perfect! Beginners anchor at $90k (minimum they'd accept)
     instead of $120k (target). Leaves no negotiation room.
     
     [Passed 3/3]
     
     Anchoring: Mastered ✓"
```

### Business (Finance - DCF)

```
AI: "You can now build DCF models. Let's calibrate.
     
     Q1: When is DCF the WRONG valuation method?"

User: "For early-stage startups with unpredictable cash flows"

AI: [Track: correct, 1/3]
    "Right! Use comparables instead for speculative companies.
     
     Q2: DCF vs Comparables - when to use each?"

User: "DCF for mature companies with steady cash flows,
       Comparables for fast-growing tech with no profits yet"

AI: [Track: correct, 2/3]
    
     Q3: Common DCF mistake beginners make?"

User: "Using the same discount rate for all years?"

AI: [Track: correct, 3/3]
    "Good! Should increase discount rate for out-years
     (more uncertainty). Another: forgetting terminal value.
     
     [Passed 3/3]
     
     DCF Valuation: Mastered ✓"
```

## State Updates

**Passed calibration (2/3+):**

```markdown
#### Calibrate ✓
date: 2026-06-27T00:00:00Z
tradeoffs:
  correct: 3
  total: 3
expert_thinking:
  - Knows when NOT to use Deployments (one-time tasks → Job)
  - Understands Deployment vs StatefulSet vs Job contexts
  - Identified common beginner mistakes (replicas=1)

Expert thinking demonstrated. Concept mastered.
```

**Failed calibration (0-1/3):**

```markdown
#### Calibrate →
date: 2026-06-27T00:00:00Z
tradeoffs:
  correct: 1
  total: 3
gaps:
  - Couldn't identify when NOT to use concept
  - Unclear on tradeoffs vs alternatives
  
Need more Practice or Calibrate attempts.
```

**Level progression:**
- Calibrate passed → Level 5-7 (can explain tradeoffs, teach others, design systems)
- Calibrate failed → Stay at Level 4, retry after more practice

## Domain-Specific Calibration

### Technical: When NOT to use, Architecture tradeoffs, Production mistakes
### Soft Skills: When approach fails, Context-dependent tactics, Interpersonal pitfalls
### Business: When method wrong, Assumptions to question, Analytical mistakes  
### Theoretical: When principle breaks, Edge cases, Misapplications

## After Calibrate

**Concept fully mastered:**
- Set review schedule (spaced repetition)
- Concept marked as mastered in map
- User ready for next concept or advanced topics
- Overall progress updated
