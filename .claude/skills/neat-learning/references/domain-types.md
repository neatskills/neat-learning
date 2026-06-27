# Domain Types

## Four Primary Domains

| Domain | Characteristics | Example Topics |
|--------|----------------|----------------|
| **Technical** | Code, systems, tools, infrastructure | Kubernetes, React, SQL, Git, AWS |
| **Business** | Strategy, analysis, modeling, operations | Financial modeling, Marketing, Product management |
| **Theoretical** | Concepts, principles, research | Psychology, Economics, Philosophy, Statistics |
| **Soft Skills** | Interpersonal, communication, leadership | Negotiation, Public speaking, Conflict resolution |

## Domain Detection

**Unambiguous topics:**
- "Kubernetes" → technical
- "Negotiation" → soft skills
- "DCF valuation" → business
- "Cognitive biases" → theoretical

**Ambiguous topics (require clarification):**
- "Machine Learning" → technical (engineering) OR theoretical (math/stats)
- "Design Thinking" → business (process) OR soft skills (creative)
- "Leadership" → soft skills (people) OR business (management)

**Detection flow:**
1. AI infers domain from topic name
2. If ambiguous: "X could be [A] or [B]. Which direction interests you?"
3. User confirms or corrects
4. Domain locked in frontmatter
