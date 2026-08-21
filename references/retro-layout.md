# Retro

Shared column definitions, reflection prompts, and Retro-block template for the Retro phase used across the neat-skill suite.

## Retro Layout

`<retro>`: this skill's name (frontmatter), not the target. 
`<target>`: input skill or path.

```text
Retro: <retro>
Target: <target>
```

Below the block, emit the Phases section, then the Reflection section.

### Phases

One row per `## Phase` heading in this skill, labeled `Phase <n> — <phase-name>`. Count each column by scanning back through this session:

- **Tool calls:** every Bash/Read/Edit/Write invocation
- **File reads:** every Read call
- **Reasoning:** low/medium/high — high if the phase ran multi-step inference with few or no tool calls

```markdown
| Phase | Tool calls | File reads | Reasoning |
|---|---|---|---|
| Phase 1 — <phase-name> | N | N | low/medium/high |
```

### Reflection

- Reasoning spikes: list each (phase/step + what instruction was unclear)
- Duplicate file reads: list each (file + phases that read it)
- Mid-run corrections: list each (what happened, what was expected; note if user-initiated)
- Tool call failures: list each (command + what failed)
