# Learn Activity

**Purpose:** Learn through questions and predictions, not explanations

**When to run:**

1. First time learning a concept (after it's added to the map)
2. Review session (test retention - fixed 5 questions)
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

**Learner agency:** `tip` and `explain` are always offered and honored immediately. `t`/hint → `tip`; `e`/explain → `explain`.

### tip

Extend the opening analogy with a concrete detail that narrows the learner's reasoning — do NOT state the answer or
eliminate options directly.

Example (Pod question):
> "Think about what makes a shipping container useful — it keeps everything inside isolated from other containers, but
> shares the same ship and loading dock."

Count as hint: `hints_needed` +1. Re-show the question after.

### explain

Give a full explanation (definition, how it works, why it matters). Then ask a comprehension question (understanding-check, not predictive) before moving on.

Count as hint: `hints_needed` +2. The comprehension question replaces the current question slot — it does not count toward the tree.

## Tree-Based Question Strategy

**Core questions (variable N):** simple (3–4), medium (5–7), complex (8–10).

- **Depth (vertical):** drill deeper when user confused or topic is critical
- **Breadth (horizontal):** explore wider when user understands well and related concepts matter for goal
- **Stop when:** sufficient understanding for goal, or diminishing returns

**Per-question flow:** Ask predictive question → user predicts → confirm or clarify → track → decide: next core / deeper / wider / stop.

## Handling Pushback

Distinguish three cases — don't just answer to end friction:

| Case | Signs | Response |
| --- | --- | --- |
| **Impatient** | has the pieces, wants speed | sharper hint, near-rhetorical question, or parallel example — `hints_needed` +1, not an explanation |
| **Genuinely stuck** | same wrong guess, silence, "no idea" | one concrete fact/rule they're missing, then next question — they complete the reasoning |
| **Uncertain / hedged** | answer ends in "?", "maybe", restates prior answer | "why does that follow?" before confirming — don't accept a hedge as understanding |

**Time-pressure test:** complaint named before any questions → real request, answer directly, offer Learn later. Complaint after questioning starts → impatience, not a constraint.

**Never** give the final answer or validate a hedged one to stop pushback — let it show in state; readiness gates handle it.

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
| **Analytical** | Estimation ("Calculate / model...") | "Company generates $100K/year for 10 years. Worth $1M today?" |
| **Strategic** | Decision ("What's the priority?") | "Growing 20% monthly, burning $500k/month, 18mo runway. What do you do?" |
| **Interpersonal** | Scenario ("In this situation...?") | "Seller says '$15k firm.' Counter $8k vs $12k?" |

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

Record results with `recordActivity`:

```javascript
const { recordActivity } = require('./scripts/map.js');

recordActivity(mapPath, conceptName, 'learn', { score: correct });
```

This writes `activity.learn` and sets the concept status to `learning`:

```yaml
learn:
  date: '2026-06-27T00:00:00.000Z'
  score: 5
```

## Common Mistakes to Avoid

| Mistake | Fix |
| --------- | ----- |
| Skipping the concept overview | Always orient before asking — zero-context learners can't predict meaningfully |
| Starting with an open question | First question is always options (recognition) — escalate once learner has foothold |
| Yes/no questions only | Use open-ended, scenario-based questions |
| Not tracking performance | Record every answer for state updates |
| Moving on too quickly | Need 4/5+ correct before Synthesize |
| Ignoring confusion patterns | Surface and address specific misconceptions |
