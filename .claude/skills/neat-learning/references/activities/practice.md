# Practice Activity

**Purpose:** Apply knowledge through domain-appropriate exercises

**When to run:**
- After Name activity (user knows terminology)
- Discover shows 4/5+ correct (strong understanding)
- All prerequisites at Level 3+

## Readiness Gates

**Practice unlocks when:**
- ✅ Discover: 4/5+ questions correct
- ✅ Name: Vocabulary introduced
- ✅ Prerequisites: All "requires" dependencies at Level 3+

**Blocked if:**
- ❌ Discover weak (<4/5 correct)
- ❌ Prerequisites missing or weak

## Domain Adaptation

Practice exercises adapt to domain:

| Domain | Exercise Type | Example |
|--------|---------------|---------|
| **Technical** | Code/config writing, debugging | "Write a Pod manifest", "Debug this failing deployment" |
| **Soft Skills** | Role-play scenarios, simulations | "Role-play salary negotiation", "Practice anchoring" |
| **Business** | Case studies, models | "Build DCF model for this startup", "Analyze this company" |
| **Theoretical** | Analysis, pattern identification | "Identify cognitive biases in these scenarios" |

## Performance Tracking

Track for each exercise:

| Signal | What | Example |
|--------|------|---------|
| **Completion** | Finished or not | "3 exercises completed" |
| **Errors** | Count and type | "2 errors: 1 conceptual, 1 syntax" |
| **Independence** | Hints needed | "Can work independently" or "Needed 2 hints" |
| **Error patterns** | What kind | "Conceptual: confused replicas field" |

## Exercise Examples

### Technical (Kubernetes - Pod)

```
AI: "Let's practice creating a Pod.
     
     Task: Create a Pod named 'my-app' running the nginx image.
     
     Try writing the YAML manifest."

User: [writes YAML with errors]

AI: "I see 2 issues. Which would prevent the Pod from starting?
     
     a) apiVersion: v2 (should be v1)
     b) replicas: 3 (Pods don't have a replicas field)
     
     Guess which breaks deployment?"

User: "b"

AI: [Track: identified conceptual error correctly]
    "Correct! This reveals something important:
     Pods don't manage replicas - that's Deployment's job.
     
     The 'replicas' error is conceptual, not just syntax.
     Fix both and try again."
```

### Soft Skills (Negotiation - Anchoring)

```
AI: "Let's practice anchoring.
     
     Role-play scenario:
     I'm a recruiter. You want $120k.
     
     I offer: 'We can do $90k, that's our budget.'
     
     What do you say?"

User: "Can you do $105k?"

AI: [Track: accepted their anchor, split difference]
    "You accepted their anchor ($90k) and split the difference.
     You didn't re-anchor with YOUR number.
     
     Common mistake: responding to their anchor instead of setting your own.
     
     Try again - same scenario. This time, set YOUR anchor first."

User: "Based on market research, the range for this role is $115k-$130k. I'm targeting $120k."

AI: [Track: correct re-anchoring]
    "Excellent! You set your own anchor and backed it with research.
     This reframes the negotiation around YOUR number, not theirs."
```

### Business (Finance - DCF)

```
AI: "Let's practice DCF valuation.
     
     Task: Build a DCF model for this startup:
     - Current revenue: $50K/year
     - Growth: 20%/year
     - Discount rate: 10%
     - 5-year projection
     
     Calculate the present value."

User: [shows calculation with error]

AI: [Track: correct formula, missed compound growth]
    "Year 1 is right ($50K → $60K).
     Year 3 is wrong - you forgot compound growth.
     
     $50K * 1.2^3 = $86.4K (not $80K)
     
     Fix this and recalculate."
```

### Theoretical (Psychology - Confirmation Bias)

```
AI: "Let's practice identifying confirmation bias.
     
     Read these 5 studies about climate change.
     Identify which ones you instinctively trust more and analyze why."

User: [analyzes, notes preference for studies matching their view]

AI: [Track: correctly identified own bias]
    "Good catch - you noticed you favored studies matching your priors.
     That's confirmation bias in action.
     
     Now: how would scientists counteract this in their own research?"
```

## State Updates

**After successful practice:**

```markdown
#### Practice ✓
date: 2026-06-27T00:00:00Z
independence: true
exercises:
  - name: Write Pod manifest
    status: complete
    errors: 0
  - name: Debug failing Pod
    status: complete
    errors: 0
  - name: Multi-container Pod
    status: complete
    errors: 1

Can work independently. All exercises completed.
```

**If practice shows gaps:**

```markdown
#### Practice →
date: 2026-06-27T00:00:00Z
independence: false
exercises:
  - name: Write Deployment
    status: attempted
    errors: 2
error_patterns:
  - Conceptual: confused replicas vs Pod count
  - Keeps making same mistake

Need more Discover on Deployment internals.
```

**Level progression:**
- Practice complete (2+ exercises, <30% errors) → Level 4 (can solve unfamiliar problems)

## Readiness for Calibrate

**Move to Calibrate when:**
- 2+ exercises completed successfully
- Error rate <30%
- Can work independently (minimal hints)

**Stay in Practice if:**
- High error rate (>30%)
- Same mistakes repeated
- Needs frequent hints
