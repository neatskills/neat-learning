# Topic Mode

## Domain Classification

| Domain | Mastered by | Examples |
| --- | --- | --- |
| **Technical** | Building / executing | Kubernetes, React, SQL, AWS |
| **Analytical** | Deriving / modeling | Statistics, Financial Modeling, Game Theory |
| **Strategic** | Deciding / evaluating | Product Management, Marketing, Stoicism |
| **Interpersonal** | Interacting / reflecting | Negotiation, Public Speaking, Leadership |

**Disambiguation — Technical vs Analytical:** "Does mastering this require executing or building something?" → yes → Technical; no → Analytical.

Confirm domain if unambiguous; present options if ambiguous.

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

Call `endSession(mapPath)`, then run Phase 4: Retro.
