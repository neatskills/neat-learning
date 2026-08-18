---
name: display-formats
description: Display format templates for session status, progress, stats, and mastery notifications — shared marker set and layout rules
---

# Display Formats

Shared markers: `[x]` mastered · `[>]` in progress · `[ ]` not started · `!` warning

## Session Status Block

Show at the start of every returning session and after routing to continue/review.

```text
[Topic] Learning: [Goal in one line]

Progress: [X]/[Y] concepts ([Z]%)
Learning Speed: [A]h per concept avg
Estimated Time Remaining: ~[D] days ([E] sessions at [F]h each)

Due for review ([N] concepts):
- [Concept 1] (overdue by [N] days)

[Section 1] ([M]/[T] mastered):
- [x] [Concept] (mastered, overdue by 1 day)
- [x] [Concept] (! [X]/3 calibrate)
- [ ] [Concept] (not started)

Current: [Section] -> [Concept]
Next: [Activity] on [Concept]

Want to continue with [Concept], or review/strengthen a concept first? [continue/review/stats]
```

**Rules:**
- Only show "Due for review" section if count > 0
- Only show sections with unlocked/mastered concepts (hide all-blocked sections)
- Review timing: only show if overdue/due today (not "in X days")
- Mastery notes: keep simple (e.g. `! X/3 calibrate`), no verbose explanations

## Progress Display

Shown when user asks for full map view.

```text
[Topic] Learning Progress

[Section 1] ([M]/[T] mastered):
  [x] [Concept] (mastered, next review: 2 days)
  [>] [Concept] (practicing)
  [ ] [Concept] (not started)

Overall: [Z]% mastered ([X]/[Y] concepts)
```

## Stats Display

Shown when user types "stats" or asks "How long?" / "When will I finish?".

```text
Learning Stats

Speed: [A]h per concept avg ([N] measured) · [Section] [x]h · [Section] [x]h est.
Remaining: [Section] [N]×[h]h + [Section] [N]×[h]h = ~[T]h total · ~[S] sessions · ~[D] days
Confidence: [Low/Medium/High] ([N] concepts measured, [Section] not yet tested)
```

## Mastery Notification

Shown after a concept reaches `mastered` status (Calibrate passed 2/3+).

```text
[Concept] mastered!

Progress: [X]/[Y] concepts ([Z]%)
Learning Speed: [A]h per concept avg
Estimated Time Remaining: ~[D] days ([E] sessions at [F]h each)

([Delta note, e.g. "Updated from 16 days - on track!"])
```
