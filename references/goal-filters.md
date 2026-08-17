# Goal Filters: Strategy C

Multiple goals per topic, one shared map. Read before creating, loading, or applying a goal filter.

**File structure:**

```text
docs/neat_learning/python/
  map.md                    # Master map, shared progress
  goals/
    review-ai-code.json     # Goal filter
    interview-prep.json     # Goal filter
```

**Filter schema:**

```json
{
  "goal": "Review AI-generated code",
  "created": "2026-06-29T12:00:00.000Z",
  "last_active": "2026-06-29T14:30:00.000Z",
  "priority_concepts": ["Variables and Types", "Control Flow", "Functions"],
  "skip_concepts": ["Problem Solving Patterns"],
  "custom_concepts": []
}
```

**Map frontmatter:**

```yaml
goals:
  - name: "Review AI-generated code"
    created: "2026-06-29T12:00:00.000Z"
  - name: "Backend development"
    created: "2026-06-29T13:00:00.000Z"
active_goal: "Review AI-generated code"
```

**Filter fields:**

- `priority_concepts`: Concepts to surface first for this goal (e.g. exam-weighted concepts or
  user-selected focus areas). Set when creating the goal filter; the activity selector picks
  from this list first before the normal dependency order.
- `skip_concepts`: Concepts to exclude from this goal's view (user chose to skip). Never delete
  from the master map — only hidden per-goal.
- `custom_concepts`: Concepts added specifically for this goal that don't appear in the master
  map. Stored here (not on the map) so they don't pollute other goals.

**Usage:** Filter when displaying progress, selecting next activity, calculating mastery,
scheduling reviews. All progress stored in master map, shared across goals.

**Scripts:** Use `scripts/goal-manager.js` for goal operations:

```javascript
const { createGoalFilter, loadGoalFilter, addGoalToMap, setActiveGoal, filterMapByGoal, countConceptsByGoal } = require('./scripts/goal-manager.js');
```

Use `countConceptsByGoal` for per-goal mastered/total counts when a goal filter is active (e.g. the Progress line in Present status, SKILL.md Phase 2 Step 7).
