# State File Format

**Location:** `docs/neat_util_learning/<topic>/map.md`

**Format:** YAML frontmatter + Markdown body

## Structure

```markdown
---
goal: Deploy applications
domain: technical
started: 2026-06-26T00:00:00Z
last_session: 2026-06-27T00:00:00Z
total_sessions: 3
progress:
  mastered: 3
  total: 6
  overall_level: 3
sections:
  - name: Foundation
    complete: true
    concepts: 1
    mastered: 1
---

# [Topic] Learning Map

## [Section Name] ✓ (X/Y mastered)

### [Concept Name]
level: 5
status: mastered
next_review: 2026-06-30T00:00:00Z
review_interval: 259200
dependencies:
  requires: [prerequisite-concept]
  enables: [enabled-concept]

[One sentence description]

#### Explore ✓
added: 2026-06-26T00:00:00Z
relationships:
  - [Relationship description]

[Narrative notes]

#### Discover ✓
questions:
  correct: 5
  total: 5
  date: 2026-06-26T00:00:00Z
signals:
  confusion: []
  strengths: [topic1, topic2]

[Narrative notes]

#### Name ✓
vocabulary_introduced: 2026-06-26T00:00:00Z
terms:
  - Term 1
  - Term 2

[Narrative notes]

#### Practice ✓
date: 2026-06-26T00:00:00Z
independence: true
exercises:
  - name: Exercise name
    status: complete
    errors: 0

[Narrative notes]

#### Calibrate ✓
date: 2026-06-27T00:00:00Z
tradeoffs:
  correct: 4
  total: 4
expert_thinking:
  - Point 1
  - Point 2

[Narrative notes]
```

## Field Types

- Dates: ISO 8601 strings (`2026-06-27T00:00:00Z`)
- Intervals: Seconds as integers
- Levels: Integers 0-7
- Status: Enum `[not-started, exploring, learning, practicing, mastered, blocked]`
