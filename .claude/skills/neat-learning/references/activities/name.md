# Name Activity

**Purpose:** Introduce terminology AFTER understanding exists from Discover

**Key principle:** Understanding first, vocabulary second

**When to run:**
- After Discover activity shows strong understanding (4/5+ correct)
- User asks "What's this called?"
- Before Practice (can't practice without knowing the terms)

## Why Understanding Before Vocabulary

**Wrong order (traditional teaching):**
1. "A Pod is the smallest deployable unit in Kubernetes..."
2. User memorizes definition
3. User doesn't really understand WHY it exists

**Right order (discovery-based):**
1. Discover: "If container crashes, what should happen?" → User builds understanding
2. Name: "That wrapper is called a Pod" → Vocabulary connects to existing understanding
3. User knows both WHAT it is and WHY it exists

## Format

### Terminology Introduction Structure

```
AI: "You now understand:
     - [Key insight 1 from Discover]
     - [Key insight 2 from Discover]
     - [Key insight 3 from Discover]
     
     This [thing] is called **[Term]**.
     
     One sentence: [Concise definition]
     
     Key vocabulary:
     - [Term 1]: [Brief explanation]
     - [Term 2]: [Brief explanation]
     - [Term 3]: [Brief explanation]
     
     When you see '[Term]' in docs, you now know what it means."
```

## Examples by Domain

### Technical (Kubernetes - Pod)

```
AI: "You now understand:
     - Containers can crash → need auto-restart
     - Kubernetes wraps containers in a management layer
     - This layer handles lifecycle, networking, storage
     
     This wrapper is called a **Pod**.
     
     One sentence: A Pod is the smallest deployable unit in Kubernetes.
     
     Key vocabulary:
     - Pod spec: YAML definition of a Pod
     - Pod lifecycle: birth → running → termination
     - Pod status: current state (Running, Failed, Pending, Succeeded)
     - Container restart policy: Always, OnFailure, Never
     
     When you see 'Pod' in Kubernetes docs, you now know it's that management wrapper."
```

### Soft Skills (Negotiation - Anchoring)

```
AI: "You now understand:
     - First number sets the negotiation range
     - Aggressive anchor ($8k for $15k car) shifts range down
     - Conservative anchor ($12k) leaves less room
     
     This is called **Anchoring** (or the anchoring effect).
     
     One sentence: Anchoring is when the first number offered sets the frame for negotiation.
     
     Key vocabulary:
     - Anchor: The first number put on the table
     - Anchoring bias: Tendency to fixate on the first number
     - Counter-anchor: Setting your own anchor to reframe
     - Aggressive anchor: Far from expected value (high risk, high reward)
     
     When you read about 'anchoring' in negotiation books, this is the concept."
```

### Business (Finance - DCF)

```
AI: "You now understand:
     - Money today > money tomorrow (time value)
     - $100K/year for 10 years ≠ $1M today
     - Need to discount future cash flows
     
     This method is called **Discounted Cash Flow** (DCF).
     
     One sentence: DCF values a business by discounting its future cash flows to present value.
     
     Key vocabulary:
     - Present Value (PV): What future money is worth today
     - Discount rate: Interest rate used for discounting
     - Cash Flow (CF): Money generated each period
     - NPV (Net Present Value): Total PV minus initial investment
     - WACC (Weighted Average Cost of Capital): Common discount rate
     
     Formula: PV = CF / (1 + r)^n
     
     When you see 'DCF valuation' in finance, this is the method."
```

### Theoretical (Psychology - Confirmation Bias)

```
AI: "You now understand:
     - We remember evidence that supports our beliefs
     - Study A (coffee reduces heart disease) sticks in your mind
     - Study B (no effect) is easier to forget
     - This happens automatically, not intentionally
     
     This is called **Confirmation Bias**.
     
     One sentence: Confirmation bias is the tendency to seek, remember, and favor information that confirms our existing beliefs.
     
     Key vocabulary:
     - Selective exposure: Seeking information that confirms beliefs
     - Selective recall: Remembering confirming evidence better
     - Motivated reasoning: Subconsciously defending existing views
     - Belief perseverance: Maintaining beliefs despite contradicting evidence
     
     When you read about 'confirmation bias' in psychology, this is the phenomenon."
```

## State Updates

After Name activity:

```markdown
#### Name ✓
vocabulary_introduced: 2026-06-27T00:00:00Z
terms:
  - Pod
  - Pod spec
  - Pod lifecycle
  - Pod status
  - container restart policy

Terminology introduced after understanding established.
```

## Readiness to Move Forward

**After Name activity:**
- Update concept Level to 2 (can explain concepts)
- User now ready for Practice activity (knows the terminology)
- Can reference official docs (vocabulary matches industry terms)

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Introducing terms too early | Wait until Discover shows understanding |
| Info dumping vocabulary | Keep it to 3-5 key terms |
| Not connecting to understanding | Always recap what user discovered first |
| Skipping the "one sentence" | User needs a memorable summary |
| Not explaining WHY terms matter | Connect to real-world usage (docs, conversations) |
