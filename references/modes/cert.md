# Cert Mode

## Initial Setup (First Session)

On cert keyword match in goal refinement, confirm cert prep in one message, then immediately web-search for the official exam guide:

**Search query**: `"[exam name or code] official exam guide blueprint domains objectives site:[vendor].com"` (e.g. `"CKA exam curriculum domains cncf.io"`, `"AWS SAA-C03 exam guide domains aws.amazon.com"`)

- **Found** → extract and build map; tell the user which blueprint was used
- **Ambiguous** → show what was found; ask the user to confirm or supply a better source
- **Not found** → ask the user to share the exam guide (PDF, paste, or link)

## Map Generation

- Map slug keyed to the exam (`cka`, `aws-saa-c03`), not the topic
- Extract from shared docs: domain names, weight percentages, objectives per domain
- Apply granularity rules to objectives: combine/split into concepts (one concept = one testable skill; aim for 5–12 per domain)
- Sections named after exam domains with weight in header: `"Cluster Architecture (25%)"`
- Sections ordered by domain weight descending; concepts within each section ordered by dependency as normal

```javascript
const { createCertMap } = require('./scripts/map.js');
const { mapPath } = createCertMap(topic, goal, domains);
```

Where `domains` is `[{ name, weight_pct, concepts: [{ name, description, dependencies }] }]`. `dependencies` is only used to decide array order when building the concept list — `createCertMap` does not persist it; the stored concept has just `name` and `description`.

Practice preference: prefer scenario-based exercises ("A company needs X — which approach and why?") over bug spotting or code writing.

## Returning Session

If map not found at the derived path, scan all maps under `./learning/` for cert maps (`cert: true`) whose exam topic relates to the user's input:
> "You have a [Exam] cert map for [Topic] — is that what you meant?"
> 1. Yes
> 2. No

- 1 → load that cert map and continue as returning session
- 2 → first session flow

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

`domain_mastery = mastered / total` per domain (skip domains with 0 concepts). Match concepts to domain by stripping the `(N%)` suffix from section headers before comparing to `domain.name` in frontmatter.

Ready when all domains ≥80%:
> "All domains at 80%+ — you're ready. Book your exam and use the official simulator for final hands-on practice."

## End State

When all concepts are mastered: skip the generic "all mastered" message — the cert readiness check handles this moment. Call `endSession(mapPath)`, then run Phase 4: Retro.
