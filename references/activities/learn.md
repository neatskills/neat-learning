# Learn Activity

**Purpose:** Learn through questions and predictions, not explanations

**When to run:**

1. First time learning a concept (after it's added to the map)
2. Review session (test retention - fixed 5 questions, see `references/spaced-repetition.md`)
3. User shows confusion in Practice (clarify)

## Concept Overview

**Always open with a brief orientation before the first question:**

1. **Orient** (1-2 sentences): open with an analogy or familiar comparison first, then connect to why it matters for the
   learner's goal — do NOT lead with a definition
2. **First question:** always options (recognition, low-stakes) — always show `→ tip  |  explain` below the options

**Template:**

```text
[Analogy: compare to something familiar]. [Why it matters for their goal].

Which of these best describes [concept]?
[a] ...
[b] ...
[c] ...

[t] tip  |  [e] explain
```

**Example (Pod, goal: deploy applications):**
> A Pod is like a shipping container for your app — it bundles one or more containers so they share
> the same network and storage and travel as a unit. For deploying applications, Pods are the smallest thing Kubernetes
> actually schedules and runs.
>
> Which of these best describes a Pod?
> [a] A container image stored in a registry
> [b] A wrapper around containers that share network and storage
> [c] A virtual machine managed by Kubernetes
>
> [t] tip  |  [e] explain

**Adaptive escalation after each answer:**

| Response | Next step |
| -------- | --------- |
| Correct + confident | Escalate: harder options, then open question |
| Correct + uncertain / hedged | Probe: ask them to justify before moving on |
| Wrong | Give one insight, ask a related question at the same level |

**Learner agency:** `tip` and `explain` are always offered on every question and honored immediately — they are part of
the design, not an interruption. If the learner types `t`, `tip`, `e`, `explain`, or asks for
"a hint" / "give me options" in free text, treat `t`/hint as `tip` and `e` as `explain`.

### tip

Extend the opening analogy with a concrete detail that narrows the learner's reasoning — do NOT state the answer or
eliminate options directly.

Example (Pod question):
> "Think about what makes a shipping container useful — it keeps everything inside isolated from other containers, but
> shares the same ship and loading dock."

Count as hint: `hints_needed` +1. Re-show the question after.

### explain

Give a full explanation of the concept (definition, how it works, why it matters). Then ask a comprehension question —
not predictive, but understanding-check — before moving on.

Example follow-up after explaining Pod:
> "Got it — so given that a Pod shares network and storage across its containers, what would happen if one container in
> a Pod crashes?"

Count as hint: `hints_needed` +2. The comprehension question does not count toward the tree — it replaces the current
question slot.

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
```

## Handling Pushback

Users push back mid-question: "just tell me," "I don't have time for this," "can you skip to the answer?"
Distinguish three cases before reacting - don't just answer, or agree, to end the friction:

**Impatient** (has the pieces, wants speed): don't give the answer. Give a sharper hint, narrow the
question until it's nearly rhetorical, or state a parallel example and ask them to apply the same
reasoning to the real one. Record it as a hint (`hints_needed` +1), not as an explanation given.

**Genuinely stuck** (repeats the same wrong guess, goes silent, "I have no idea"): give one concrete
piece to stand on - state the single fact or rule they're missing - then ask the next question
building from it. Still a hint, not surrender: they complete the reasoning, not you.

**Uncertain / hedged** (answer ends in "?", leans on "maybe"/"I think", or restates a prior answer
instead of reasoning fresh): don't accept a hedge as confirmed understanding just because it isn't
wrong. Ask them to justify it - "why does that follow?" - before confirming or moving on. This applies
even when the flaw is on your side: if a question assumed something that turns out false (e.g. you
implied a third violation exists and it doesn't), say so plainly and correct the premise, but still make
them re-derive or restate the real answer - don't let their hedge stand in for that confirmation. Caving
to an uncertain answer to close the loop is exactly the "just answer to end the friction" failure this
section exists to prevent, even though no literal answer was given.

**Time-pressure test:** if a deadline or blocker was named up front, before any questions were asked,
treat it as a real fire-and-forget request - answer directly, offer to run Learn properly later. If the
time complaint only appears after questioning has started, treat it as impatience, not a constraint.

**Never:** give the final answer, or validate a hedged/uncertain one, just to stop the pushback. Let it
show up honestly in the state instead - a question that took 3+ hints stays a question that took 3+
hints, and the readiness gates below already handle it (frequent hints keeps the concept in Learn rather
than advancing to Synthesize).

## Hint Budget and Re-ask

**Max hints per question by type:**

| Question type | Max hints | Then |
| ------------- | --------- | ---- |
| Options (recognition) | 1 | Narrow to near-rhetorical |
| Open / core | 1 | Narrow to near-rhetorical |
| Open / depth or breadth | 2 | Narrow to near-rhetorical |

**At threshold:** Never state the full answer. Instead, collapse the question to near-rhetorical — a
fill-in-the-blank, a binary choice, or the answer with one word missing. Record hints in state, move
to the next question.

Example: "The container doesn't restart because the restart policy is set to ___."

**End-of-session re-ask:** After all questions complete, re-ask any that hit the threshold — one fresh
question per concept, different framing, same difficulty. One shot, no hints.

- *"Let's try this from a different angle — one shot:"*
- Correct → understanding confirmed, record reduced hints penalty
- Wrong → state the answer directly, move on. No further attempts.

The re-ask terminates cleanly either way. If they cannot answer even a fresh question, the concept
hasn't landed — spaced repetition will bring it back sooner via high `hints_needed`.

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

Record results with `recordLearn`, then save:

```javascript
const { loadState, saveState } = require('./scripts/state-manager.js');
const { recordLearn } = require('./scripts/activity-updater.js');

// concept is the entry in data.sections[i].concepts
recordLearn(concept, correct, total, hintsNeeded, confusionPatterns, strengths, coverage);
saveState(mapPath, data, content);
```

This writes `activity.learn` and sets the concept status to `learning`:

```yaml
learn:
  date: '2026-06-27T00:00:00.000Z'
  questions:
    correct: 5
    total: 5
  hints_needed: 0
  coverage:
    core: [lifecycle, restart-policy]
    depth: [init-containers]
    breadth: []
  signals:
    confusion: []
    strengths: [lifecycle, container-relationship, restart-policy]
```

For weak understanding, record confusion patterns as strings, e.g.
`["Mixing up Deployment vs ReplicaSet"]` - they drive the readiness criteria above.

## Common Mistakes to Avoid

| Mistake | Fix |
| --------- | ----- |
| Skipping the concept overview | Always orient before asking — zero-context learners can't predict meaningfully |
| Starting with an open question | First question is always options (recognition) — escalate once learner has foothold |
| Yes/no questions only | Use open-ended, scenario-based questions |
| Not tracking performance | Record every answer for state updates |
| Moving on too quickly | Need 4/5+ correct before Synthesize |
| Ignoring confusion patterns | Surface and address specific misconceptions |
