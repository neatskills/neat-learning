# Calibrate Activity

**Purpose:** Develop expert judgment - when rules break, tradeoffs, common mistakes

**When to run:** After Practice (2+ exercises complete, status `practicing`), final activity before mastery

## Expert Thinking: 3-Question Pattern

Ask 3 types, user must pass 2/3:

| Question Type | Purpose | Example |
| --------------- | --------- | --------- |
| **Negative case** | When NOT to use | "When would Deployment be WRONG?" |
| **Tradeoff** | X vs Y - when each? | "Deployment vs StatefulSet - when each?" |
| **Common mistake** | What do beginners mess up? | "What subtle error do beginners make with Pods?" |

## Pass Criteria

**Pass 2/3 correctly:**

- Concept status → `mastered`
- Review schedule starts (2-day initial interval)
- Ready for advanced topics

**Pass 0-1/3:**

- Status stays `practicing`
- More calibration or return to Practice

## State Updates

Record results with `recordActivity`:

```javascript
const { recordActivity } = require('./scripts/map.js');

recordActivity(mapPath, conceptName, 'calibrate', { correct });
```

This writes `activity.calibrate`; on 2+ correct it sets status to `mastered`,
otherwise status stays `practicing`:

```yaml
calibrate:
  date: '2026-06-27T00:00:00.000Z'
  judgment:
    correct: 3
    total: 3
  expert_thinking:
    - Knows when NOT to use Deployments (one-time tasks need Job)
    - Understands Deployment vs StatefulSet vs Job contexts
    - Identified common beginner mistakes (replicas=1)
```

On failure, record the gaps in `expert_thinking` as needs
(e.g. `["Needs refinement: couldn't identify when NOT to use concept"]`).

## Domain-Specific Calibration

| Domain | Focus Areas |
| -------- | ------------- |
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
