# Practice Activity

**Purpose:** Apply knowledge through domain-appropriate exercises

**When to run:** After Synthesize, Learn shows 4/5+ correct, all prerequisites practicing or mastered

## Readiness Gates

**Unlocks when:**

- Learn: 4/5+ questions correct
- Synthesize: Vocabulary introduced

**Blocked if:**

- Learn weak (<4/5 correct)

## Domain Adaptation

| Domain | Exercise Type | Example |
| -------- | --------------- | --------- |
| **Technical** | Bug spotting, decisions, code review | "Find errors in this code", "Which implementation is better?" |
| **Analytical** | Quantitative problems, models | "Build DCF model for startup", "Derive the confidence interval" |
| **Strategic** | Case studies, framework application | "Analyze this company's competitive position", "Which strategy fits?" |
| **Interpersonal** | Role-play scenarios | "Role-play salary negotiation", "Practice anchoring" |

### Technical Domain: Critical Evaluation vs Code Writing

**Critical evaluation exercises** (prefer these over code writing — apply understanding, not repeat it):

1. **Bug spotting** - Show buggy code, user identifies errors and explains why
2. **Decision-making** - Present scenario, user chooses right approach with reasoning
3. **Code review** - Compare implementations, user evaluates which follows best practices
4. **Requirement → Design** - Give requirement, user outlines solution structure (not full code)

**Avoid:**

- Full project setup (clutters working directory)
- Writing code from scratch (redundant with Learn phase)
- Repetitive exercises explaining what code does (already covered in Synthesize)

**Notes:** Use code snippets in conversation (no files). For critical concepts, optionally use `/tmp` for throwaway verification.

#### Bug Spotting Exercise Strategy

2–3 exercises per concept, each with 2–3 bugs spanning different categories: transport/communication, lifecycle (startup/shutdown/cleanup), async/sync handling, error handling/logging, security (validation, injection, path traversal), resource management (leaks, connection pools).

**Adapt:** most bugs caught (e.g. 5/6) → move on. Many missed (e.g. 2/6) → add a targeted exercise on the weak area. Simple concepts may need only 1 exercise; critical/complex concepts warrant the full 2–3.

**Example:** Exercise 1 — transport conflict, async handling, error handling. Exercise 2 — lifecycle cleanup, memory leak, validation.

## Performance Tracking

| Signal | What | Example |
| -------- | ------ | --------- |
| **Completion** | Finished or not | "3 exercises completed" |
| **Errors** | Count and type | "2 errors: 1 conceptual, 1 syntax" |
| **Independence** | Hints needed | "Can work independently" or "Needed 2 hints" |
| **Error patterns** | What kind | "Conceptual: confused replicas field" |

## State Updates

Record results with `recordActivity`:

```javascript
const { recordActivity } = require('./scripts/map.js');

recordActivity(mapPath, conceptName, 'practice');
```

This writes `activity.practice` and sets the concept status to `practicing`:

```yaml
practice:
  date: '2026-06-27T00:00:00.000Z'
```

## Readiness for Calibrate

**Move to Calibrate when:**

- 2+ exercises completed successfully
- Error rate <30%
- Can work independently (minimal hints)

**Stay in Practice if:**

- High error rate (≥30%)
- Same mistakes repeated
- Needs frequent hints
