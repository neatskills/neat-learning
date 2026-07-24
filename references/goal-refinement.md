# Goal Refinement

**Purpose:** Help users clarify vague or overly broad learning goals before building concept maps

**When to use:** After user states their goal, BEFORE detecting domain or building map

## Goal Quality Criteria

### Good Goals (Specific & Actionable)

**Characteristics:**

- Clear outcome ("build X", "deploy Y", "review Z")
- Specific scope (not "learn everything")
- Real-world application or constraint
- Easy to prioritize concepts

**Examples:**

- "Build MCP servers"
- "Deploy applications with Kubernetes"
- "Review AI-generated code"
- "Pass CKA certification"
- "Scale MCP server for high traffic while improving security"

### Vague Goals (Need Refinement)

**Red flags:**

- Abstract verbs ("understand", "learn", "know")
- Missing scope ("deeply", "advanced", "everything")
- No application context
- Multiple unrelated outcomes

**Examples:**

- "Learn MCP deeply"
- "Understand advanced patterns"
- "Know Kubernetes"
- "Master negotiation and leadership and strategy"

## Refinement Questions

### Pattern 1: Too Broad/Abstract

**User says:** "Learn [topic] deeply/advanced/everything"

**Ask:**

1. "Are you building/using/reviewing [topic]?"
2. "Do you have a specific project or use case?"
3. "Which aspects matter most: [A], [B], or [C]?"

**Example:**

```text
User: "Learn MCP deeply"
AI: "That's quite broad! Let me help narrow it:
     - Are you building MCP servers or using existing ones?
     - Do you have a production deployment need?
     - Any specific concerns (scale, security, integration)?"

User: "Building servers for production with scaling needs"
AI: "Great! So your goal is: 'Build production-ready MCP servers that scale'?"
```

### Pattern 2: Multiple Outcomes

**User says:** "Learn [X] and [Y] and [Z]"

**Analyze relationship:**

- **Related (same workflow):** "Scale AND secure" → Keep combined
- **Unrelated (different contexts):** "Code review AND interview prep" → Split

**Ask:**

```text
"I see two outcomes: [X] and [Y]
 - Are these for the same project/context?
 - Which is more urgent/important?
 - Should we focus on one first, or tackle both?"
```

**Decision tree:**

- Related + same priority → Combined goal with both aspects
- Related + different priority → Separate goals, suggest sequence
- Unrelated → Separate goals, ask which to start with

### Pattern 3: No Context

**User says:** "[Action] [topic]" with no application

**Examples:** "Understand negotiation", "Learn React", "Know PostgreSQL"

**Ask:**

1. "What will you do with this knowledge?"
2. "Is this for a specific project/job/situation?"
3. "What's the outcome you want?"

**Refine to action-oriented goal:**

- "Understand negotiation" → "Negotiate salary offers"
- "Learn React" → "Build React components for my app"
- "Know PostgreSQL" → "Design database schemas" or "Optimize queries"

## Refinement Process

1. **Identify red flags** - check against vague goal patterns: abstract verbs,
   missing scope, multiple outcomes
2. **Ask clarifying questions** - use pattern-specific questions above;
   aim for specific action + clear scope + real context
3. **Propose refined goal** - "So your goal is: '[refined goal]'?" - user confirms or adjusts
4. **Validate** - specific outcome? clear what to prioritize? easy to know when achieved?

**If still vague:** Ask one more round of questions

**If clear:** Proceed to domain detection

## Multi-Goal Splitting Criteria

**When to split:**

- Different domains (technical vs soft skills vs business)
- Different timelines (urgent vs later)
- Unrelated contexts (work vs personal project vs certification)
- User explicitly wants separate tracks

**When to combine:**

- Same workflow (scale + security for production)
- Sequential steps (understand → build → deploy)
- Mutually reinforcing (code review + best practices)
- User wants holistic view

**After splitting:**

- Offer to focus on one first
- Or manage both with separate goal filters (same map, different priorities)
