# Synthesize Activity

**Purpose:** Consolidate scattered insights, introduce terminology, build mental model

**Key principle:** Synthesis after understanding - pull together insights, add vocabulary,
show how concepts connect

**When to run:** After Learn shows strong understanding (4/5+ correct), before Practice
(need consolidated understanding + vocabulary)

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

Record results with `recordActivity`:

```javascript
const { recordActivity } = require('./scripts/map.js');

recordActivity(mapPath, conceptName, 'synthesize', {});
```

This writes `activity.synthesize` (status stays `learning`):

```yaml
synthesize:
  completed: '2026-06-27T00:00:00.000Z'
  terms: [Pod, Pod spec, Pod lifecycle, Pod status, restart policy]
  mental_model: "Pod wraps containers, spec defines desired state, lifecycle manages runtime"
```

## Common Mistakes to Avoid

| Mistake | Fix |
| --------- | ----- |
| Introducing terms too early | Wait until Learn shows understanding |
| Info dumping vocabulary | Keep it to 3-5 key terms |
| Not connecting to understanding | Always recap what user discovered first |
| Skipping the "one sentence" | User needs a memorable summary |
| Not explaining WHY terms matter | Connect to real-world usage (docs, conversations) |
