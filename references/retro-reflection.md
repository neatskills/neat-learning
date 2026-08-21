# Retro: Reflection

Shared column definitions and reflection prompts for the Retro phase used across the neat-skill suite.

## Column Definitions

Count each column by scanning back through this session:

- **Tool calls:** count every Bash/Read/Edit/Write invocation in the phase
- **File reads:** count every Read tool call
- **Reasoning:** rate low / medium / high — high if the phase ran multi-step inference with few or no tool calls

## Reflection

Reflection — omit any item where count is zero:

- Reasoning spikes: list each (phase/step + what instruction was unclear)
- Duplicate file reads: list each (file + phases that read it)
- Mid-run corrections: list each (what happened, what was expected; note if user-initiated)
- Tool call failures: list each (command + what failed)
