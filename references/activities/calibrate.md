# Calibrate Activity

**Purpose:** Develop expert judgment - when rules break, tradeoffs, common mistakes

**When to run:** After Practice (2+ exercises complete), user at Level 4+, final activity before mastery

## Expert Thinking: 3-Question Pattern

Ask 3 types, user must pass 2/3:

| Question Type | Purpose | Example |
|---------------|---------|---------|
| **Negative case** | When NOT to use | "When would Deployment be WRONG?" |
| **Tradeoff** | X vs Y - when each? | "Deployment vs StatefulSet - when each?" |
| **Common mistake** | What do beginners mess up? | "What subtle error do beginners make with Pods?" |

## Pass Criteria

**Pass 2/3 correctly:**

- Concept → Level 5-7 (expert thinking)
- Marked as "mastered" or "calibrated"
- Ready for advanced topics or review schedule

**Pass 0-1/3:**

- Stay at Level 4
- More calibration or return to Practice

## State Updates

**Passed calibration (2/3+):**

```markdown
#### Calibrate ✓
date: 2026-06-27T00:00:00Z
tradeoffs: {correct: 3, total: 3}
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
tradeoffs: {correct: 1, total: 3}
gaps:
  - Couldn't identify when NOT to use concept
  - Unclear on tradeoffs vs alternatives
  
Need more Practice or Calibrate attempts.
```

**Level progression:**

- Calibrate passed → Level 5-7 (can explain tradeoffs, teach others, design systems)
- Calibrate failed → Stay at Level 4, retry after more practice

## Domain-Specific Calibration

| Domain | Focus Areas |
|--------|-------------|
| **Technical** | When NOT to use, architecture tradeoffs, production mistakes |
| **Soft Skills** | When approach fails, context-dependent tactics, interpersonal pitfalls |
| **Business** | When method wrong, assumptions to question, analytical mistakes |
| **Theoretical** | When principle breaks, edge cases, misapplications |

## After Calibrate

**Concept fully mastered:**

- Set review schedule (spaced repetition)
- Mark as mastered in map
- Ready for next concept or advanced topics
- Update overall progress
