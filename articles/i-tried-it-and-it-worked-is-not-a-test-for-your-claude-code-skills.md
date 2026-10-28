---
title: '"I tried it and it worked" is not a test for your Claude Code skills'
description: >-
  Trying a skill by hand is a test with a human grader. It runs once, on your
  project, with today's model. Evals run the same check without you: a scratch
  project, a prompt, graders, and the score with and without your skill.
date: '2026-10-28'
tags:
  - ai
  - claudecode
  - testing
  - productivity
series: Evals for Claude Code skills
---
> A skill that works when you try it has passed one test, graded by you, once.

For months, this is how I tested my Claude Code skills. Open a sample project, create a clean branch, run the skill, read what it wrote. If it looked right, ship it.

That isn't nothing. It's a real test with a human grader: you set up the project, you write the prompt, you judge the result. The problem is everything around it:

- **It runs once.** An agent doesn't do the same thing twice. One good run can be luck.
- **It runs on your project**, the one you wrote the skill against.
- **It runs on today's model.** When the model changes, nobody tries it again.
- **It needs you.** So it doesn't run in CI, and it doesn't run after the small edit that "can't break anything".

The example I use throughout this series is [twd-ai](https://github.com/BRIKEV/twd-ai), the Claude Code plugin for [TWD](https://twd.dev), a browser testing library I maintain. It has a skill that sets the library up in a project, one that writes the CI workflow, and one that writes, runs and fixes tests. Nothing in these articles depends on it: swap in your own plugin and every step applies.

## What an eval is

An eval is a test for an agent's behaviour. Instead of checking that a function returns a value, it checks that Claude, with your skill loaded, does what the skill promises. It runs for real: Claude reads files, writes code and runs commands, and when it's done, a set of checks scores the result.

Claude Code ships one: [`claude plugin eval`](https://code.claude.com/docs/en/plugin-evals). Each case has three parts:

1. **A scaffold**: a script that creates a small starting project in a temporary folder.
2. **A prompt**: what a user would type.
3. **Graders**: the checks that score what happened.

A trimmed case from my suite:

```yaml
name: setup-vite-react-query
context:
  scaffold_script: scaffold.sh
execution:
  allowed_tools: [Read, Glob, Grep, Skill]
  prompt: /twd:setup
graders:
  - name: vite-plugin-imported
    type: regex
    pattern: 'from\s+["'']twd-js/vite-plugin["'']'
    target: { source: file, path: vite.config.ts }
  - name: no-entry-file-code
    type: regex
    pattern: 'initTWD|twd-js'
    match: not_contains
    target: { source: file, path: src/main.tsx }
  - name: patterns-file-attempted
    type: tool_used
    tool: Write
    input_match: '\.claude/twd-patterns\.md'
```

The last grader reads the agent's actions, not the disk: eval runs refuse writes into `.claude/`, so it checks that the skill tried to write its notes file there.

The scaffold writes a small Vite + React app with heredocs. It installs nothing, so the case needs no network.

Graders come in two families. Some check **what was written**: a pattern is in a file, or isn't. Others check **what the agent did**: it called a tool, with this input, before that other call. For what a regex can't decide, there's an `llm` grader: a judge model reads the file against a criterion you write and votes pass or fail, three times.

## With and without your skill

This is the part I didn't expect to matter most. Every case runs twice: **with** your plugin and **without** it. The difference, Δ, is what your skill adds on top of what the model already knows.

My setup case on Opus:

| | Score |
|---|---|
| With the plugin | 1.00 |
| Without the plugin | 0.10 |
| Δ | +0.90 |

Without the skill, the model reads the same project files, says the setup command "isn't installed in this session", and does it by hand from what it knows. It wires the library into the app's entry file, which the library no longer needs, and never writes the config file.

A Δ near zero doesn't mean a case is useless. It means the model already knows how to do it. The case still guards against an edit to the skill that breaks it: if that happens, the score with the plugin drops.

## Run it more than once

Because an agent doesn't behave the same every time, each case runs three times and the score is the average. A run's score is the share of graders that passed. `--threshold 0.9` decides what counts as a pass: it tolerates a grader failing once in three runs, not one that fails every time.

```bash
# While editing a skill: one run, with the plugin only
claude plugin eval . --scaffold --runs 1 --ablation none --allow-tools Write Edit

# Before a release: three runs, with and without the plugin
claude plugin eval . --scaffold --threshold 0.9 \
  --model claude-opus-5-5 --judge-model claude-sonnet-5-5 --allow-tools Write Edit
```

The full suite, eight cases on Opus, costs about $10 and 25 minutes. The quick mode is under $2.

## Fakes: mock your tools like you mock your APIs

The eval sandbox has no browser and no network, and one of my skills runs tests in a browser. So the scaffold writes a stand-in test runner: it honours the filter flag, writes a report in the same format as the real one, and fails a test that mocks a URL the app never requests.

It's the same idea as mocking an API in a test. You're testing how the skill reacts to the tool, not the tool. The real runner has its own tests in its own repo.
## Graders that lie

A failing grader is fine: it tells you something. The dangerous one passes when it shouldn't, because nobody looks at a green check. It happened to me three times:

- **A regex that read too far.** `beforeEach\([\s\S]*?twd\.clearComponentMocks` was meant to check that mocks are cleared in `beforeEach`. The lazy match kept going into the `afterEach` below it and passed a file that cleared them in the wrong place.
- **"The skill was invoked" passed, and the skill did nothing.** The skill ran in a forked subagent that only saw its arguments. Invoked without arguments, it replied that it had no goal, and the main agent wrote the tests on its own, without the skill's rules. The test looked fine.
- **A check on the call, not the result.** Two graders checked that the skill ran the type checker and the linter. They looked at whether the command was called, not whether it worked. For a while every one of those commands failed for an unrelated reason (Node was installed under my home folder, which the sandbox can't read), and both graders stayed green.

Before trusting a new grader, run it against a file that should pass and one that should fail.

## It doesn't replace trying it

I still run my skills by hand on real projects. The eval doesn't replace that; it tells me when to. When a case drops after an edit, or after a model release, I know exactly where to look.

The scenarios twd-ai guards, and their scores per model, are on [twd.dev](https://twd.dev/twd-ai/evals).

Next in this series: reading the trace, the file that turns a score into a reason.
