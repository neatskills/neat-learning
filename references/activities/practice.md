# Practice Activity

**Purpose:** Apply knowledge through domain-appropriate exercises

**When to run:** After Synthesize, Learn shows 4/5+ correct, all prerequisites practicing or mastered

## Readiness Gates

**Unlocks when:**

- Learn: 4/5+ questions correct
- Synthesize: Vocabulary introduced
- Prerequisites: All "requires" dependencies at status `practicing` or `mastered`
  (check `concept.dependencies.requires` array against concept statuses in all sections)

**Blocked if:**

- Learn weak (<4/5 correct)
- Prerequisites missing or weak

## Domain Adaptation

| Domain | Exercise Type | Example |
| -------- | --------------- | --------- |
| **Technical** | Bug spotting, decisions, code review | "Find errors in this code", "Which implementation is better?" |
| **Soft Skills** | Role-play scenarios | "Role-play salary negotiation", "Practice anchoring" |
| **Business** | Case studies, models | "Build DCF model for startup", "Analyze company" |
| **Theoretical** | Analysis, pattern ID | "Identify cognitive biases in scenarios" |

### Technical Domain: Critical Evaluation vs Code Writing

**Prefer critical evaluation over code writing:**

Practice should be about **applying understanding**, not repeating what was covered in Learn/Synthesize.

**Critical evaluation exercises:**

1. **Bug spotting** - Show buggy code, user identifies errors and explains why
2. **Decision-making** - Present scenario, user chooses right approach with reasoning
3. **Code review** - Compare implementations, user evaluates which follows best practices
4. **Requirement → Design** - Give requirement, user outlines solution structure (not full code)

**Avoid:**

- Full project setup (clutters working directory)
- Writing code from scratch (redundant with Learn phase)
- Repetitive exercises explaining what code does (already covered in Synthesize)

**Implementation notes:**

- Use code snippets in conversation (no files created)
- For critical concepts, optionally use `/tmp` for throwaway verification
- Focus on evaluation skills that prepare for Calibrate (expert judgment)

#### Bug Spotting Exercise Strategy

**Hybrid Approach (Density + Adaptive):**

**Structure:**

- **2-3 bug spotting exercises** per concept (not just 1)
- Each exercise contains **2-3 bugs** covering different error categories
- **Adapt:** If learner catches all bugs easily → move on. If learner misses many → add targeted exercises.

**Error categories to cover (for technical concepts):**

- Transport/communication issues
- Lifecycle errors (startup, shutdown, cleanup)
- Async/sync handling
- Error handling and logging
- Security issues (validation, injection, path traversal)
- Resource management (memory leaks, connection pools)

**Example progression:**

1. Exercise 1: 3 bugs (transport conflict, async handling, error handling)
2. Exercise 2: 3 bugs (lifecycle cleanup, memory leaks, validation)
3. If 5/6 caught → move to next activity type
4. If 2/6 caught → add Exercise 3 focusing on weak areas

**For simpler concepts:** 1 bug spotting exercise may be sufficient

**For critical/complex concepts:** 2-3 exercises ensure comprehensive coverage of common traps

## Performance Tracking

| Signal | What | Example |
| -------- | ------ | --------- |
| **Completion** | Finished or not | "3 exercises completed" |
| **Errors** | Count and type | "2 errors: 1 conceptual, 1 syntax" |
| **Independence** | Hints needed | "Can work independently" or "Needed 2 hints" |
| **Error patterns** | What kind | "Conceptual: confused replicas field" |

## State Updates

Record results with `recordPractice`, then save:

```javascript
const { loadState, saveState } = require('./scripts/state-manager.js');
const { recordPractice } = require('./scripts/activity-updater.js');

recordPractice(concept, exercises, independence, errorPatterns);
saveState(mapPath, data, content);
```

This writes `activity.practice` and sets the concept status to `practicing`:

```yaml
practice:
  date: '2026-06-27T00:00:00.000Z'
  independence: true
  exercises:
    - name: Write Pod manifest
      status: complete
      errors: 0
    - name: Debug failing Pod
      status: complete
      errors: 0
  error_patterns: []
```

For weak practice, set `independence: false` and record `error_patterns`
(e.g. `["Conceptual: confused replicas vs Pod count"]`) - they drive the
readiness decision below.

## Readiness for Calibrate

**Move to Calibrate when:**

- 2+ exercises completed successfully
- Error rate <30%
- Can work independently (minimal hints)

**Stay in Practice if:**

- High error rate (>30%)
- Same mistakes repeated
- Needs frequent hints
