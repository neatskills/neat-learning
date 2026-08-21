# Retro: Reflection

Shared column definitions, reflection prompts, and Retro-block template for the Retro phase used across the neat-skill suite.

## Template

`<name>`: this skill's name (frontmatter), not the target. `Target:`: input skill or path.

```text
Retro: <name>
Target: <target-name-or-path>
```

Below the block, emit the Reflection section (see below) and a perf table — one row per `## Phase` heading in this skill, labeled `Phase <n> — <phase-name>`.

For *(avg/skill)* rows: record total ÷ N skills (e.g. 104 s total / 4 skills = 26 s/skill).

## Column Definitions

Count each column by scanning back through this session:

- **Tool calls:** count every Bash/Read/Edit/Write invocation in the phase
- **File reads:** count every Read tool call
- **Reasoning:** rate low / medium / high — high if the phase ran multi-step inference with few or no tool calls

## Reflection

Omit any item where count is zero:

- Reasoning spikes: list each (phase/step + what instruction was unclear)
- Duplicate file reads: list each (file + phases that read it)
- Mid-run corrections: list each (what happened, what was expected; note if user-initiated)
- Tool call failures: list each (command + what failed)
