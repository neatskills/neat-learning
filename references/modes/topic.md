# Topic Mode

## Map Generation

Use your knowledge to design a learning path. Structure: Foundation → Core → Advanced. Concepts ordered by dependency within each section.

**Granularity:** one concept = one tradeoff or decision a practitioner makes. Aim for 5–15 concepts per map. Combine objectives that share a single mental model; split objectives that require separate decisions.

```javascript
const { createMap } = require('./scripts/map.js');
const { mapPath } = createMap(topic, goal, domain, sections);
```

Where `sections` follows Foundation → Core → Advanced order:

```javascript
[
  { name: 'Foundation', description: '...', concepts: [...] },
  { name: 'Core',       description: '...', concepts: [...] },
  { name: 'Advanced',   description: '...', concepts: [...] }
]
```

## End State

When all concepts are mastered:
> "You've mastered all concepts! Want to add an advanced concept or start a new goal?"
