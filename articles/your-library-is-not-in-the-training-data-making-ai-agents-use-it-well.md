---
title: "Your library isn't in the training data: making AI agents use it well"
description: >-
  Models know React and Jest by heart. They don't know your internal SDK, your
  design system or your niche open source library, and they fill the gaps with
  what they do know. Here's a toolkit to fix that: layered docs, types, a
  linter, structured output and evals.
date: '2026-10-13'
tags:
  - ai
  - claudecode
  - opensource
  - productivity
---
> A model that doesn't know your library doesn't fail by doing nothing. It fails by confidently writing code for a library it does know.

Ask an AI agent to write a React component with Jest tests and it'll do a decent job. There are millions of examples of both in its training data.

Now ask it to use something it has never seen:

- your company's internal API client;
- your design system;
- a niche open source library;
- a new major version that changed everything.

You'll get code that looks right, compiles in the agent's head, and is wrong in small, confident ways. The agent isn't guessing at random. It fills every gap with the closest thing it knows. An option name from a similar library. An import from the popular alternative. A return shape it assumed.

I've spent the last months on this problem with [TWD](https://twd.dev), a testing library I maintain that almost no model knows yet, and a Claude Code plugin that writes tests with it. This is the toolkit I ended up with. None of it is specific to my library.

## 1. Give the model knowledge, not just rules

Whatever you hand the agent (a skill, an `AGENTS.md`, an `llms.txt`, a docs page), it is the only place the model can learn your API. So spend that space on what teaches:

- **Signatures written out in full**, with the option names spelled correctly.
- **What things return**, especially when it differs from the popular library the model will assume.
- **The patterns**: the order things have to happen in, the setup every file needs.
- **Complete, correct examples.** With a model, one working example beats three paragraphs of explanation.

What you shouldn't fill it with is warnings. A list of "never do X" written three times doesn't stop the mistake; a program checking for it does. I wrote a whole post about why: [Prose does not beat determinism](/posts/prose-does-not-beat-determinism-stop-asking-your-ai-agent-to-remember).

### Load it in layers

Context isn't free, and the agent pays for every byte on every request. My first reference doc was 32 KB, and the agent loaded all of it to write a three-test file.

Now it's split: a core of about 8 KB with what most tasks need, and a second file with the rest that the agent only reads when the task calls for it. Claude Code skills support this directly, since files under `references/` are loaded on demand. For any other setup it's the same idea: a short core, with links to the details.

## 2. Make the compiler teach your API

A typed API is documentation the model can't ignore, as long as somebody runs the compiler.

When the agent invents an option name or passes arguments in the wrong order, a type check turns that into an error in seconds, instead of a bug found at runtime. So:

- **Type your public API strictly.** An option that's silently ignored when misspelled is a trap for people and agents alike. Make it a compile error.
- **Tell the agent to type-check what it wrote before running anything.** It's one line in the instructions, and it's the cheapest check you have.

## 3. Lint what types can't see

Some mistakes are valid code: a missing `await`, an import from the popular alternative library, a debugging leftover like `.only`, reading a property that's always undefined for your API.

That's what a small, focused linter is for. For my library it's four rules. Three properties made it work well with agents:

- **Zero config.** One command, no setup, the same result in every project. If the agent first has to configure your linter, it won't run it reliably.
- **Autofix for the safe cases.** If the fix is always correct (adding `await` inside an `async` function), just apply it.
- **Messages that say what to do.** Not "invalid usage", but the cause and the fix in one sentence. The agent's next action is in the error message, and a human gets the same help.

Before trusting it, run it against every real project you can find. A rule that fires on working code teaches the agent something false.

## 4. Design your output for two readers

An agent reading a console log will grep for checkmarks, count lines, and sometimes get it wrong. Your CLI has two readers now: a human and a program.

- **Write a JSON report** next to the pretty output. Mine has the outcome, each failure with its error, and the diagnostics a person would look for.
- **Offer `--format json`** on every command that reports problems.
- **Document your exit codes**, and make them mean something: clean, problems found, nothing to do.

## 5. Test your instructions with evals

Instructions regress like any code. A well-meant edit can quietly drop a rule the agent depended on, and nothing tells you.

An eval is a test for an agent: set up a small project, give the agent a task, then grade what it produced. In Claude Code that's `claude plugin eval`. A case is a folder with a scaffold script, a prompt and a list of graders:

```yaml
prompt: |
  Write tests for the todo page: the list, the empty state,
  a failed load, and adding a todo.
graders:
  - name: right-imports
    type: regex
    pattern: 'from\s+["'']twd-js/runner["'']'
    target: { source: file, path: src/twd-tests/todos.twd.test.ts }
  - name: linter-ran
    type: tool_used
    tool: Bash
    input_match: 'twd-lint'
```

What I learned running them:

- **They find real gaps.** Before one round of fixes, my old instructions scored 0.50 on a case. Half the checks failed, on a task I thought was covered.
- **Prefer deterministic graders.** A regex on the file the agent wrote, or "did it call this tool", gives the same answer every time. Keep an LLM judge for what can't be matched, like "is this one test per flow, or one per element".
- **Make judge criteria precise.** My judge failed a correct file because the criteria said "awaits every call", and one of those calls is synchronous. Listing the async calls by name fixed it.
- **Plant mistakes.** One of my cases starts from a file with four planted errors and checks that the agent runs the linter and leaves the file clean.
- **Don't run them on every PR.** They cost real money: about $1.80 for my five cases. I run them before releases and after changing the instructions. On every PR, CI runs `claude plugin validate --strict`, which is free and offline, plus a small script that checks every file the instructions reference exists.

## 6. Keep the instructions honest

The quietest failure is drift: the library moves on, and the instructions don't.

When I compared my agent's instructions with the library's docs and source, I found an option documented that the library ignores, and a default stated backwards. The agent followed the instructions faithfully. The instructions were wrong.

Two habits help:

- **No version notes.** "Fixed in 1.8" or "requires 1.9+" means nothing to a model that doesn't know which version you're on. Describe the current behaviour.
- **Check claims against the source, not your memory.** And if a rule in your instructions has a reason attached, make sure the reason is true. One of mine wasn't, for months.

## The checklist

If your library, SDK or design system isn't something models know yet:

1. Teach the API once, with complete examples, in layers.
2. Type it so wrong calls fail to compile, and have the agent run the compiler.
3. Lint what types miss, with zero config, autofix and messages that say what to do.
4. Give agents JSON and exit codes, not logs.
5. Write evals with mostly deterministic graders, and run them before releases.
6. Keep the instructions honest against the source.

Maybe one day the models will know your library the way they know React. Until then, your library has to make up for what the model doesn't know.
