# Practice Activity

**Purpose:** Apply knowledge through domain-appropriate exercises

**When to run:** After Synthesize, Learn shows 4/5+ correct, all prerequisites at Level 3+

## Readiness Gates

**Unlocks when:**

- ✅ Learn: 4/5+ questions correct
- ✅ Synthesize: Vocabulary introduced
- ✅ Prerequisites: All "requires" dependencies at Level 3+

**Blocked if:**

- ❌ Learn weak (<4/5 correct)
- ❌ Prerequisites missing or weak

## Domain Adaptation

| Domain | Exercise Type | Example |
|--------|---------------|---------|
| **Technical** | Code/config writing, debugging | "Write Pod manifest", "Debug failing deployment" |
| **Soft Skills** | Role-play scenarios | "Role-play salary negotiation", "Practice anchoring" |
| **Business** | Case studies, models | "Build DCF model for startup", "Analyze company" |
| **Theoretical** | Analysis, pattern ID | "Identify cognitive biases in scenarios" |

## Performance Tracking

| Signal | What | Example |
|--------|------|---------|
| **Completion** | Finished or not | "3 exercises completed" |
| **Errors** | Count and type | "2 errors: 1 conceptual, 1 syntax" |
| **Independence** | Hints needed | "Can work independently" or "Needed 2 hints" |
| **Error patterns** | What kind | "Conceptual: confused replicas field" |

## State Updates

**Successful practice:**

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

Can work independently. All exercises completed.
```

**Shows gaps:**

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
  - Same mistake repeated

Need more Learn on Deployment internals.
```

**Level progression:** Practice complete (2+ exercises, <30% errors) → Level 4 (can solve unfamiliar problems)

## Readiness for Calibrate

**Move to Calibrate when:**

- 2+ exercises completed successfully
- Error rate <30%
- Can work independently (minimal hints)

**Stay in Practice if:**

- High error rate (>30%)
- Same mistakes repeated
- Needs frequent hints
