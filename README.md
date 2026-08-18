# Neat Learning

AI-guided discovery-based learning system that makes you think before it explains.

## Core Principle

**Learn by thinking first.** Every interaction uses questions and predictions to build
understanding before introducing terminology or explanations.

## How It Works

First, the AI maps what to learn: it builds a customized concept map based on your
goal, organized into Foundation → Core → Advanced sections with dependencies between
concepts. Then each concept goes through four activities:

### 1. **Learn** - Discover through questions

- **Tree-based exploration:** AI controls depth and breadth dynamically
- Start with core questions (varies: 3-10 based on complexity)
- Go **deeper** when confused or topic is critical
- Go **wider** when understood and related concepts matter
- Stop when you demonstrate sufficient understanding for your goal

### 2. **Synthesize** - Connect the dots

- Consolidate scattered insights from learning
- Introduce formal terminology AFTER you understand
- Build mental models showing how concepts connect

### 3. **Practice** - Apply hands-on

- Domain-adapted exercises (code, scenarios, calculations, analysis)
- Track independence, errors, patterns
- Unlock when prerequisites met

### 4. **Calibrate** - Develop expert judgment

- When NOT to use (negative cases)
- Tradeoffs (when to choose X vs Y)
- Common beginner mistakes
- Move from "can do" to "know when/why"

## Features

- **Goal-driven exploration:** "Deploy apps" vs "Pass cert" vs "Understand fundamentals" shapes depth/breadth
- **4 domain support:** Technical, Analytical, Strategic, Interpersonal
- **Multi-session state:** JSON map file (`map.json`) for persistence
- **Mastery tracking:** not-started, learning, practicing, mastered - per concept

## Install

```text
/plugin marketplace add neatskills/neat-learning
/plugin install neat-learning
```

## Quick Start

```bash
# In Claude Code
/neat-learning
```

**Then:**

```text
"Teach me Kubernetes"
"Help me understand negotiation"
"Continue my React learning"
```

AI will ask your goal, detect domain, build initial map, and start with Learn questions.

## Example: Learning Kubernetes Pods

**Map:** 7 core aspects identified (crashes, containers, creation, deletion, health, placement, networking)

**Learn:**

- Core: "What happens when container crashes?" → You predict → AI confirms
- Confused? Go **deeper**: "What's a restart policy?" → "When use 'Never'?"
- Got it? Go **wider**: "Init containers?" → "Sidecar patterns?"
- Result: 12/14 questions correct, covered core + deployment-relevant depth

**Synthesize:** "You discovered: containers restart, health checks matter, multiple containers
share network. This is called a **Pod**. Mental model: Pod wraps containers → spec defines
desired state → lifecycle manages runtime → status shows current state."

**Practice:** "Write a Pod manifest running nginx with liveness probe"

**Calibrate:** "When would you NOT use a Deployment?" → "StatefulSet vs Deployment - when each?" → "Common Pod mistakes?"

## Documentation

See [`SKILL.md`](SKILL.md) for complete system documentation.

## License

MIT
