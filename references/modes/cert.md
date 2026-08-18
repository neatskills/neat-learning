# Cert Mode

## Initial Setup (First Session)

On cert keyword match in goal refinement, confirm and ask for docs in one message:
> "This looks like cert prep. Share the official exam guide (PDF, paste, or link) and I'll build a map calibrated to it."

- **User shares docs** → extract blueprint (see Map Generation below)
- **User has no docs** → "I need the official blueprint for an accurate cert map — come back when you have it, or I can build a general [topic] map instead. [cert later / general now]"

## Map Generation

- Map slug keyed to the exam (`cka`, `aws-saa-c03`), not the topic
- Extract from shared docs: domain names, weight percentages, objectives per domain
- Apply granularity rules (`references/map-concepts.md`) to objectives: combine/split into concepts
- Sections named after exam domains with weight in header: `"Cluster Architecture (25%)"`
- Sections ordered by domain weight descending; concepts within each section ordered by dependency as normal

```javascript
const { createCertMap } = require('./scripts/map.js');
const { mapPath } = createCertMap(topic, goal, domains);
```

Where `domains` is `[{ name, weight_pct, concepts: [{ name, description, dependencies }] }]`.

Practice preference: prefer scenario-based exercises ("A company needs X — which approach and why?") over bug spotting or code writing.

## Returning Session

If map not found at the derived path, scan all maps under `docs/neat_learning/` for cert maps (`cert: true`) whose exam topic relates to the user's input:
> "You have a [Exam] cert map for [Topic] — is that what you meant? [y/n]"
- Yes → load that cert map and continue as returning session
- No → first session flow

If no related cert map found → first session flow.

On load: if `data.cert === true`, cert mode is active — apply Practice preference and run the readiness check after every Calibrate.

## Cert Readiness Check

After recording Calibrate results, check mastery. At ≥80% overall, show per-domain breakdown:

```text
CKA Readiness Check

Overall: 18/22 concepts mastered (82%)

By domain:
  Cluster Architecture   (25%)   5/5  ✓
  Troubleshooting        (30%)   4/7  — focus here before booking
```

`domain_mastery = mastered / total` per domain (skip domains with 0 concepts). Match concepts to domain by stripping the ` (N%)` suffix from section headers before comparing to `domain.name` in frontmatter.

Ready when all domains ≥80%:
> "All domains at 80%+ — you're ready. Book your exam and use the official simulator for final hands-on practice."

## End State

When all concepts are mastered: skip the generic "all mastered" message — the cert readiness check handles this moment.
