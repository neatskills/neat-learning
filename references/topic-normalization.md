# Topic Normalization

**Purpose:** Standardize topic names to prevent duplicates and maintain clean learning structure

**When to use:** After user states topic, BEFORE checking for existing maps

## The Problem

**User expressions vary:**
- "MCP" vs "model-context-protocol" vs "Model Context Protocol"
- "k8s" vs "Kubernetes" vs "kubernetes"
- "JS" vs "JavaScript" vs "javascript"
- "React.js" vs "React" vs "react"

**Without normalization:**
- Creates duplicate directories: `docs/neat_learning/mcp/` AND `docs/neat_learning/model-context-protocol/`
- Separate learning maps for same topic
- Lost progress when user uses different name

## Normalization Rules

### Rule 1: Lowercase with Hyphens (Slug Format)

**Canonical format:** `lowercase-with-hyphens`

**Transform:**
- Remove special characters except hyphens
- Convert spaces to hyphens
- Lowercase everything
- Remove trailing/leading hyphens

**Examples:**
- "Model Context Protocol" → `model-context-protocol`
- "Kubernetes" → `kubernetes`
- "React.js" → `react-js`
- "Python 3" → `python-3`

### Rule 2: Common Abbreviations/Aliases

**Maintain alias mapping:** abbreviation → canonical name

**Technical topics:**
- "k8s" → `kubernetes`
- "JS" → `javascript`
- "TS" → `typescript`
- "MCP" → `model-context-protocol`
- "LLM" → `large-language-models`
- "ML" → `machine-learning`
- "AI" → `artificial-intelligence`

**Frameworks/Libraries:**
- "React.js" → `react`
- "Vue.js" → `vue`
- "Next.js" → `nextjs`
- "Node.js" → `nodejs`

**Languages:**
- "py" → `python`
- "rb" → `ruby`
- "go" → `golang`

**Business/Soft Skills:**
- "negotiating" → `negotiation`
- "leadership skills" → `leadership`

### Rule 3: Version Handling

**Strategy:** Strip versions unless specifically requested

**Default (no version):**
- "Python 3" → `python` (not `python-3`)
- "React 18" → `react` (not `react-18`)
- "Kubernetes 1.28" → `kubernetes`

**Explicit version request:**
- "Python 2 vs Python 3 differences" → Keep version context in goal, not topic
- Topic still: `python`
- Goal: "Understand Python 2 to 3 migration"

**Exception:** Fundamentally different
- "Angular" vs "AngularJS" → Separate topics (different frameworks)
- "Python 2" vs "Python 3" (if user explicitly learning legacy) → Separate

### Rule 4: Pluralization

**Strategy:** Singular form preferred

**Transform:**
- "negotiations" → `negotiation`
- "algorithms" → `algorithm`
- "design patterns" → `design-patterns` (keep plural when it's the standard term)

**Exceptions (standard plural forms):**
- "design patterns" → `design-patterns`
- "data structures" → `data-structures`
- "best practices" → `best-practices`

## Normalization Process

**Step 1: Get raw topic from user**

```
User: "Teach me MCP"
Raw topic: "MCP"
```

**Step 2: Apply normalization**

```javascript
function normalizeTopic(raw) {
  // Check alias mapping first
  const aliases = {
    'mcp': 'model-context-protocol',
    'k8s': 'kubernetes',
    'js': 'javascript',
    // ... more aliases
  };
  
  const lower = raw.toLowerCase().trim();
  
  // Check if it's a known alias
  if (aliases[lower]) {
    return aliases[lower];
  }
  
  // Apply slug transformation
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars except hyphen
    .replace(/\s+/g, '-')           // Spaces to hyphens
    .replace(/-+/g, '-')            // Multiple hyphens to single
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
}
```

**Step 3: Check for existing maps**

```javascript
const normalized = normalizeTopic(userInput);
const mapPath = `docs/neat_learning/${normalized}/map.md`;

if (exists(mapPath)) {
  // Found existing learning map
  return loadExistingMap(mapPath);
}
```

**Step 4: Confirm with user**

```
User: "Teach me MCP"
Normalized: model-context-protocol

AI: "I'll help you learn Model Context Protocol (MCP). Is that correct? [y/n]"
```

**Why confirm:**
- User sees canonical name
- Catches normalization errors
- Builds shared vocabulary

## Alias Registry

**Maintain in code (not user-facing):**

```javascript
const TOPIC_ALIASES = {
  // Technical abbreviations
  'mcp': 'model-context-protocol',
  'k8s': 'kubernetes',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'ml': 'machine-learning',
  'ai': 'artificial-intelligence',
  'llm': 'large-language-models',
  
  // Framework variations
  'react.js': 'react',
  'reactjs': 'react',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'next.js': 'nextjs',
  'nextjs': 'nextjs',
  'node.js': 'nodejs',
  'nodejs': 'nodejs',
  
  // Language variations
  'golang': 'go',
  'ecmascript': 'javascript',
  
  // Common misspellings/variations
  'kube': 'kubernetes',
  'docker-compose': 'docker-compose',
  'postgres': 'postgresql',
  'psql': 'postgresql',
};
```

## Edge Cases

### Case 1: Ambiguous Abbreviation

**Example:** "ML" could be "Machine Learning" or "ML (programming language)"

**Strategy:**
- If common abbreviation: use mapping
- If ambiguous: ask user

```
User: "Teach me ML"
AI: "By ML, do you mean:
     [a] Machine Learning
     [b] ML (programming language)
     [c] Something else"
```

### Case 2: Multi-word Topics

**Keep hyphens for readability:**
- "Machine Learning" → `machine-learning`
- "Data Structures" → `data-structures`
- "Design Patterns" → `design-patterns`

**Not:** `machinelearning` (hard to read)

### Case 3: Branded Names

**Respect official casing in display, normalize in files:**
- Display: "Kubernetes", "React", "PostgreSQL"
- File path: `kubernetes/`, `react/`, `postgresql/`

### Case 4: User Says "Continue learning X" with Different Name

**Example:**
```
Session 1: "Teach me Model Context Protocol"
Created: docs/neat_learning/model-context-protocol/

Session 2: "Continue my MCP learning"
Normalized: model-context-protocol → Found existing map!
```

**No duplicate created, seamless continuation**

## Implementation Checklist

When user provides topic:

1. Normalize topic name (apply rules)
2. Check alias registry
3. Check for existing map with normalized name
4. Confirm canonical name with user
5. Use normalized name for:
   - Directory structure
   - Map file path
   - Cross-references

Display canonical name (proper casing) to user, use normalized name (slug) in files.

## Integration with Skill Flow

**Updated first session flow:**

1. **Get topic**
   - User provides: "MCP" / "Model Context Protocol" / "model context protocol"
   
2. **→ Normalize topic** (NEW - this document)
   - Apply slug transformation
   - Check alias registry
   - Result: `model-context-protocol`
   
3. **Check existing maps**
   - Look for: `docs/neat_learning/model-context-protocol/map.md`
   - If exists: load state, offer to continue
   - If not: confirm canonical name, proceed
   
4. Get goal
5. Refine goal
6. Detect compound goals
7. Detect domain
8. Generate map (using normalized topic name)
9. Begin Learn

**Time cost:** Negligible (instant normalization)
**Benefit:** No duplicate learning paths, clean structure
