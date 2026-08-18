# Map Concepts

## Domain Types

| Domain | Characteristics | Example Topics |
| -------- | ---------------- | ---------------- |
| **Technical** | Code, systems, tools, infrastructure | Kubernetes, React, SQL, Git, AWS |
| **Business** | Strategy, analysis, modeling, operations | Financial modeling, Marketing, Product management |
| **Theoretical** | Concepts, principles, research | Psychology, Economics, Philosophy, Statistics |
| **Soft Skills** | Interpersonal, communication, leadership | Negotiation, Public speaking, Conflict resolution |

**Detection flow:**

1. Infer domain from topic name
2. If ambiguous: "X could be [A] or [B]. Which direction interests you?"
3. User confirms → domain locked in frontmatter

**Ambiguous examples:**

- "Machine Learning" → technical (engineering) OR theoretical (math/stats)
- "Design Thinking" → business (process) OR soft skills (creative)
- "Leadership" → soft skills (people) OR business (management)

## Concept Granularity

**Rule: One Concept = One Tradeoff Decision**

A concept is the right size if:

1. Can be explained in 2-3 minutes to someone who knows the prerequisites
2. Has a clear "when NOT to use this" answer (tradeoff exists)
3. Can be tested independently

**Examples:**

| Domain | Too broad | Right size |
|---|---|---|
| **Kubernetes** | Kubernetes networking | Pod, ClusterIP, NodePort, LoadBalancer (each distinct tradeoff) |
| **Negotiation** | Negotiation tactics | Anchoring, BATNA (each specific technique) |
| **Finance** | Valuation methods | DCF, Comparables, Precedents |
