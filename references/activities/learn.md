# Learn Activity

**Purpose:** Learn through questions and predictions, not explanations

**When to run:**

1. First time learning a concept (after Plan adds to map)
2. Review session (test retention)
3. User shows confusion in Practice (clarify)

## Tree-Based Question Strategy

**Core principle:** User thinks and predicts BEFORE AI explains

**Structure:**

1. **Core questions (variable N):**
   - N varies by complexity: simple (3-4), medium (5-7), complex (8-10)
   - Determined by concept's natural structure

2. **Depth (vertical):** Drill deeper when user confused OR topic critical for goal
   - Example: "Container crashes?" → "Restart policy?" → "When use 'Never'?"

3. **Breadth (horizontal):** Explore wider when user understands well AND related concepts matter for goal
   - Example: Pod basics → init containers → sidecars → lifecycle phases

4. **Stop when:** Sufficient understanding for goal, covered core + relevant depth/breadth, diminishing returns

**Per-question flow:**

```text
Ask predictive question → User predicts → Confirm or clarify → 
Track performance → Decide: next core / deeper / wider / stop
```text

## Performance Tracking

| Signal | What to Track | Example |
| -------- | --------------- | --------- |
| **Correctness** | Correct / total | "5/5 correct" |
| **Hints** | How many needed | "0 hints" or "3 hints (above average)" |
| **Confusion patterns** | Specific misconception | "Confused Pod vs Container" |
| **Strengths** | What user grasps well | "Understands lifecycle, restart-policy" |

## Question Types by Domain

| Domain | Question Type | Example |
| -------- | --------------- | --------- |
| **Technical** | Predictive ("What happens if...?") | "Container crashes?" → "3 identical copies?" |
| **Soft Skills** | Scenario ("In this situation...?") | "Seller says '$15k firm.' Counter $8k vs $12k?" |
| **Business** | Estimation ("Calculate...") | "Company generates $100K/year for 10 years. Worth $1M today?" |
| **Theoretical** | Pattern ("Which? Why?") | "Study A cuts heart disease. Study B: none. Which remember better?" |

## Readiness Criteria

**Move to Synthesize when:**

- 4/5+ questions correct (80%+ understanding)
- Minimal hints needed (0-1 per question)
- No major confusion patterns

**Stay in Learn if:**

- <3/5 correct (need more learning)
- Confusion pattern detected (specific misconception)
- Hints needed frequently (>2 per question)

## State Updates

**Strong understanding:**

```markdown
#### Learn ✓
date: 2026-06-27T00:00:00Z
questions: {correct: 5, total: 5}
hints_needed: 0
signals:
  confusion: []
  strengths: [lifecycle, container-relationship, restart-policy]

Strong understanding demonstrated. Ready for Synthesize.
```text

**Weak understanding:**

```markdown
#### Learn →
date: 2026-06-27T00:00:00Z
questions: {correct: 2, total: 5}
hints_needed: 3
signals:
  confusion:
    - pattern: "Mixing up Deployment vs ReplicaSet"
    - specific: "What creates the ReplicaSet?" (wrong 2x)
  needs: "More discovery on Deployment internals"

Confusion detected. Needs reinforcement.
```text

## Common Mistakes to Avoid

| Mistake | Fix |
| --------- | ----- |
| Explaining before asking | Always ask predictive question first |
| Yes/no questions only | Use open-ended, scenario-based questions |
| Not tracking performance | Record every answer for state updates |
| Moving on too quickly | Need 4/5+ correct before Synthesize |
| Ignoring confusion patterns | Surface and address specific misconceptions |
