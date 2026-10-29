---
title: The score tells you what failed. The trace tells you why.
description: >-
  An eval score says which grader failed. The trace, a line-by-line log of
  every step the agent took, says why. How to read one, the jq queries that
  make it fast, and a method to find where a passing run and a failing run
  split.
date: '2026-10-29'
tags:
  - ai
  - claudecode
  - testing
  - debugging
series: Evals for Claude Code skills
---
> Don't change a skill because of a score. Change it because of what the trace showed.

A case scores 0.25. Three graders failed: the test file is missing, so every check on its contents failed too. That's all the score can tell you. Was it the skill, the model, the sandbox, or the eval itself? Each one needs a different fix, and a score can't tell them apart.

The trace can. Every eval run with `claude plugin eval` records one: a log of every step the agent took, what each tool returned, and how the run ended.

## Keep the trace

By default the eval deletes each run's folder. Pass `--keep-temp` and it prints where each one is:

```bash
claude plugin eval . --scaffold --case setup-vite-react-query --runs 1 --keep-temp \
  --allow-tools Write Edit
```

The folder is sealed read-only, so open it first, and don't run git inside it:

```bash
chmod 700 /private/tmp/e-XXXX /private/tmp/e-XXXX/sealed
```

The trace is `out/trace.jsonl`.

## What's in it

JSONL: one JSON object per line, each with a `type`. A run of 20 turns had almost a thousand lines, but only a few kinds matter:

| `type` | What it is | Read it? |
|---|---|---|
| `system` / `init` | First line: model, available tools, permission mode | Yes |
| `system` / `thinking_tokens` | Reasoning token counters, most of the file | No, noise |
| `system` / `permission_denied` | A tool call the sandbox refused | Yes |
| `assistant` | What the model did: text, or a tool call | Yes, this is the story |
| `user` | What the tool returned | Yes |
| `result` | Last line: turns, cost, final message | Yes |

## Make it readable with jq

[jq](https://jqlang.org/) queries JSON from the command line, and JSONL is exactly what it's good at. This filter prints the conversation, one line per step:

```jq
select(.type=="assistant" or .type=="user") | .type as $who | .message.content[]? |
  if .type=="text" then "\($who) 💬 \(.text[0:150])"
  elif .type=="tool_use" then "\($who) 🔧 \(.name) \(.input|tostring|.[0:120])"
  elif .type=="tool_result" then "\($who) ↩️  \(.content|tostring|.[0:150])"
  else empty end
```

```bash
jq -r -f conversation.jq /private/tmp/e-XXXX/out/trace.jsonl
```

A few more I run on every trace:

```bash
# Which tools, how often
jq -r 'select(.type=="assistant")|.message.content[]?|select(.type=="tool_use")|.name' trace.jsonl | sort | uniq -c

# Which files it read: the context it loaded
jq -r 'select(.type=="assistant")|.message.content[]?|select(.type=="tool_use" and .name=="Read")|.input.file_path' trace.jsonl

# What was refused
jq -r 'select(.type=="user")|.message.content[]?|select(.type=="tool_result" and .is_error==true)|.content|tostring|.[0:100]' trace.jsonl

# Turns and cost
jq -c 'select(.type=="result")|{num_turns,total_cost_usd,duration_ms}' trace.jsonl
```

## The method: find where they split

One trace on its own is hard to judge. Two traces of the same case, one that passed and one that failed, are easy. Put their tool calls side by side and look for the **first step where they differ**. Everything after it is a consequence.

This is a setup skill on Opus, with the plugin (left, score 1.00) and without it (right, score 0.10):

```
Bash cat package.json vite.config.ts ...  |  Bash cat package.json vite.config.ts ...
Read package.json                         |  Bash cat tsconfig.app.json eslint.config.js ...
Read vite.config.ts                       |  Write src/main.tsx
Read index.html                           |  Write tsconfig.app.json
Read eslint.config.js                     |  Write src/twd-tests/todos.twd.test.ts
Glob **/*                                 |  Edit package.json
Read src/query-client.ts                  <
Read src/main.tsx                         <
Read .../skills/setup/references/server-state-cache.md
Read .../skills/setup/references/twd-lint.md
Read tsconfig.app.json                    <
Write .claude/twd-patterns.md             <
Write vite.config.ts                      <
Write twd.config.json                     <
...
```

By the third step, one of them is writing. The run without the plugin is already writing, and its first file is the app's entry point, the old way to set the library up. The run with the plugin keeps detecting, and reads the two reference files that match what it found in the project. The model's own words at the split confirm it: "The `/twd:setup` command isn't installed in this session, so I'm doing the TWD setup by hand from what I know of `twd-js`."

Then four questions:

1. **`init`**: which model, which tools?
2. **The split**: the first step where the passing and failing runs differ.
3. **Just before it**: what did the last tool return?
4. **At it**: what did the model decide with that? Read its text around this point only.

## Strict on purpose

Reading denials, I found the run with the plugin had a shell command refused: one long detection command chaining `cat`, `find`, `git` and `grep`. The model switched to reading the files one by one and still scored 1.00.

The eval runs in a mode that refuses anything not allowed in advance. In daily use you'd approve that command, or in auto mode a classifier would. So the eval is stricter than real use, which is the right way round: a skill that passes here passes in your terminal. The opposite, an eval more permissive than reality, would hand you inflated scores.

## What I check, in order

1. The score, to know which case and which graders.
2. Two traces side by side, one passing and one failing, to find the split.
3. The model's text around the split, to see the decision.
4. Only then, the fix: the skill, the eval, or neither.

Most of the surprises in my eval work came from this file, not from the scores: a forked skill that never received its task, a sandbox that couldn't run `npx`, a model that stopped after the first green run. The score said something failed. The trace said what to do about it.

Next in this series: [Evals tell you which parts of your skill to delete](https://kevinmartinez.dev/posts/evals-tell-you-which-parts-of-your-skill-to-delete/)
