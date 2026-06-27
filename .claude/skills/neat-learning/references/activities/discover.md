# Discover Activity

**Purpose:** Learn through questions and predictions, not explanations

**When to run:**
1. First time learning a concept (after Explore adds it to map)
2. Review session (test retention)
3. User shows confusion in Practice (run more Discover to clarify)

## Question-Based Learning Pattern

**Core principle:** User thinks and predicts BEFORE AI explains

**Flow:**
```
AI asks predictive question
    ↓
User guesses/predicts
    ↓
AI confirms or clarifies (not full explanation yet)
    ↓
Track signal: correct/incorrect, hints needed
    ↓
Next question or move to Name activity
```

## Performance Tracking

Track these signals for each concept:

| Signal | What to Track | Example |
|--------|---------------|---------|
| **Correctness** | Questions correct / total | "5/5 correct" |
| **Hints** | How many hints needed | "0 hints" or "3 hints (above average)" |
| **Confusion patterns** | What specific misconception | "Confused Pod vs Container" |
| **Strengths** | What user grasps well | "Understands lifecycle, restart-policy" |

## Question Types by Domain

### Technical (Kubernetes example)

**Predictive:**
- "If a container crashes, what should Kubernetes do?"
- "What if you need 3 identical copies running?"
- "How would you expose a Pod to network traffic?"

**Comparison:**
- "What's the difference between a Pod and a Deployment?"
- "When would you use ConfigMap vs Secret?"

### Soft Skills (Negotiation example)

**Scenario-based:**
- "Seller says '$15k firm.' What happens if you counter $8k vs $12k?"
- "You want $120k. Recruiter offers $90k. What do you say?"

**Predictive:**
- "If you anchor too aggressively, what happens?"

### Business (Finance example)

**Estimation:**
- "Company generates $100K/year for 10 years. Worth more or less than $1M today? Why?"
- "Startup grows 20%/year. Year 3 revenue?"

### Theoretical (Psychology example)

**Pattern recognition:**
- "You believe coffee is healthy. Study A: reduces heart disease. Study B: no effect. Which do you remember better?"
- "Why do you remember Study A more?"

## Readiness Criteria

**Move to Name activity when:**
- 4/5+ questions correct (80%+ understanding)
- Minimal hints needed (0-1 hints per question)
- No major confusion patterns

**Stay in Discover if:**
- <3/5 correct (need more discovery)
- Confusion pattern detected (specific misconception to address)
- Hints needed frequently (>2 per question)

## State Updates

After Discover activity, update concept state:

```markdown
#### Discover ✓
date: 2026-06-27T00:00:00Z
questions:
  correct: 5
  total: 5
hints_needed: 0
signals:
  confusion: []
  strengths: [lifecycle, container-relationship, restart-policy]

Strong understanding demonstrated. Ready for Name activity.
```

Or if weak:

```markdown
#### Discover →
date: 2026-06-27T00:00:00Z
questions:
  correct: 2
  total: 5
hints_needed: 3
signals:
  confusion:
    - pattern: "Mixing up Deployment vs ReplicaSet"
    - specific: "What creates the ReplicaSet?" (wrong 2x)
  needs: "More discovery on Deployment internals"

Confusion detected. Needs reinforcement before Practice.
```

## Example Session

**Kubernetes - Pod concept:**

```
AI: "Before I explain Pods, let me ask: if a container crashes, what should Kubernetes do?
     a) Restart it automatically
     b) Leave it crashed
     c) Delete the whole application
     d) Alert but don't touch it"

User: "a - Restart it"

AI: [Track: correct, no hints]
    "Exactly! Kubernetes handles failures automatically.
     
     Next: What if you need 3 identical copies running?"

User: "Make 3 Pods?"

AI: [Track: partially correct, needs clarification]
    "Close! You COULD manually create 3 Pods, but what if one crashes?
     You'd need to manually create a replacement. Any ideas for automating this?"

User: "Some kind of manager?"

AI: [Track: correct reasoning after hint]
    "Perfect! That's exactly why Deployments exist.
     
     [After 5 questions total: 4 correct, 1 hint given]
     
     You've got a strong grasp of Pod concepts. Ready to learn the terminology?"
```

## Common Mistakes to Avoid

| Mistake | Fix |
|---------|-----|
| Explaining before asking | Always ask predictive question first |
| Yes/no questions only | Use open-ended, scenario-based questions |
| Not tracking performance | Record every answer for state updates |
| Moving on too quickly | Need 4/5+ correct before Name activity |
| Ignoring confusion patterns | Surface and address specific misconceptions |
