# Topic Mode

## Map Generation

Use your knowledge to design a learning path. Structure: Foundation → Core → Advanced. Concepts ordered by dependency within each section.

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
