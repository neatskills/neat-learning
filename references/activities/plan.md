# Plan Activity

**Purpose:** Build/expand concept map - planning what to learn

**When to run:**

1. First session: build initial map
2. User asks about unknown concept: "What's StatefulSet?"
3. User requests expansion: "What else should I know?"

## Initial Map Building

**Input:** topic, goal, domain

**Process:**

1. AI generates concept list customized to goal
2. Organizes into sections (Foundation → Core → Advanced)
3. Sets dependencies for each concept:
   ```javascript
   dependencies: {
     requires: ['Prerequisite Concept'],  // must learn first
     enables: ['Next Concept']            // this unlocks
   }
   ```
4. Shows map to user for confirmation
5. Updates state with sections and concepts

**Output:** Populated map with concepts at Level 0, dependencies set

## Examples

**Kubernetes + "Deploy applications":**

Sections:

- Foundation: Pod
- Core: Deployment, Service, ConfigMap, Secret
- Advanced: Volume

Dependencies structure:

```javascript
{
  name: 'Pod',
  dependencies: {
    requires: [],
    enables: ['Deployment', 'Service']
  }
},
{
  name: 'Deployment',
  dependencies: {
    requires: ['Pod'],
    enables: ['Scaling', 'Rolling Updates']
  }
},
{
  name: 'Service',
  dependencies: {
    requires: ['Pod'],
    enables: ['Ingress']
  }
}
```

**Negotiation + "Salary negotiation":**

Sections:

- Foundation: BATNA, Reservation price
- Core: Anchoring, Mirroring, Silence
- Advanced: Multi-issue negotiation, Time pressure

Dependencies:

- BATNA requires: none (foundation)
- Anchoring requires: BATNA; enables: salary-range-setting

## Adding Concepts Mid-Journey

**Trigger:** User asks "What's [X]?"

**Process:**

1. Check if X in current map → skip Plan, run Learn
2. If not in map: explain X briefly
3. Ask: "Should I add [X] to your map?"
4. If yes: determine section, set dependencies, add to state
5. If no: answer question but don't persist

**Output:** Map expanded with new concept at Level 0
