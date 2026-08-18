# Calibrate Activity

**Purpose:** Develop expert judgment - when rules break, tradeoffs, common mistakes

**When to run:** After Practice (2+ exercises complete, status `practicing`), final activity before mastery

## Expert Thinking

Ask 3 questions — when NOT to use, X vs Y tradeoff, common beginner mistake — pass 2/3.

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

recordActivity(mapPath, conceptName, 'calibrate', { score: correct });
```

This writes `activity.calibrate`; on score ≥ 2 it sets status to `mastered`,
otherwise status stays `practicing`:

```yaml
calibrate:
  date: '2026-06-27T00:00:00.000Z'
  score: 3
  attempts: 1
```

## After Calibrate

**Concept fully mastered:**

- Set review schedule (spaced repetition)
- Mark as mastered in map
- Ready for next concept or advanced topics
- Update overall progress
