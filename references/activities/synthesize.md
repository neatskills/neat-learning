# Synthesize Activity

**Purpose:** Consolidate scattered insights, introduce terminology, build mental model

**Key principle:** Synthesis after understanding - pull together insights, add vocabulary,
show how concepts connect

**When to run:** After Learn shows strong understanding (4/5+ correct), before Practice
(need consolidated understanding + vocabulary)

## Why Understanding Before Vocabulary

**Wrong order (traditional):**

1. "A Pod is the smallest deployable unit..." → User memorizes definition → Doesn't understand WHY it exists

**Right order (discovery-based):**

1. Learn: "If container crashes, what should happen?" → User builds understanding
2. Name: "That wrapper is called a Pod" → Vocabulary connects to understanding
3. User knows both WHAT it is and WHY it exists

## Format

```text
AI: "You now understand:
     - [Key insight 1 from Learn]
     - [Key insight 2 from Learn]
     - [Key insight 3 from Learn]

     This [thing] is called **[Term]**.

     One sentence: [Concise definition]

     Key vocabulary:
     - [Term 1]: [Brief explanation]
     - [Term 2]: [Brief explanation]
     - [Term 3]: [Brief explanation]

     When you see '[Term]' in docs, you now know what it means."
```

## State Updates

Record results with `recordSynthesize`, then save:

```javascript
const { loadState, saveState } = require('./scripts/state-manager.js');
const { recordSynthesize } = require('./scripts/activity-updater.js');

recordSynthesize(concept, termsIntroduced, mentalModel);
saveState(mapPath, data, content);
```

This writes `activity.synthesize` (status stays `learning`):

```yaml
synthesize:
  completed: '2026-06-27T00:00:00.000Z'
  terms: [Pod, Pod spec, Pod lifecycle, Pod status, restart policy]
  mental_model: "Pod wraps containers, spec defines desired state, lifecycle manages runtime"
```

## Readiness to Move Forward

**After Synthesize:**

- Ready for Practice (has consolidated understanding and terminology)
- Can reference official docs (vocabulary matches industry terms)

## Common Mistakes to Avoid

| Mistake | Fix |
| --------- | ----- |
| Introducing terms too early | Wait until Learn shows understanding |
| Info dumping vocabulary | Keep it to 3-5 key terms |
| Not connecting to understanding | Always recap what user discovered first |
| Skipping the "one sentence" | User needs a memorable summary |
| Not explaining WHY terms matter | Connect to real-world usage (docs, conversations) |
