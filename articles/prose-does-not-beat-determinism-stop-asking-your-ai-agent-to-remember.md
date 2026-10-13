---
title: 'Prose does not beat determinism: stop asking your AI agent to remember'
description: >-
  My agent instructions said "ALWAYS await" three times, and the agent still
  forgot. What fixed it wasn't a better prompt: it was moving each rule into a
  type check, a linter or a structured report.
date: '2026-10-13'
tags:
  - ai
  - claudecode
  - testing
  - productivity
---
> If a rule can be checked by a program, stop asking the model to remember it.

Most of us improve an AI agent the same way. It makes a mistake, so we add a rule to the prompt, the skill or the `CLAUDE.md`. It makes the mistake again, so we make the rule bold. Then capitals. Then a section called **NEVER DO THIS**.

I did exactly that for months, on a Claude Code plugin I maintain that writes and runs frontend tests. This post is about what replaced it, and why I think it applies to any agent setup, not just mine.

## The instructions that said everything three times

The plugin's agent writes tests with [TWD](https://twd.dev), a testing library I maintain. The important rules looked like this:

- At the top, in **Hard Constraints**: "Always `await` async methods."
- In a **Do / Don't** list in the middle: the same rule, worded differently.
- In a **Common Mistakes** list at the end: "1. A missing `await`."

Every important rule existed three times, with `WRONG` / `RIGHT` code blocks in between. A single "write tests for this page" request loaded 56 KB of instructions.

And the agent still forgot an `await` now and then.

When it did, nothing caught it until the tests ran in a browser: start the dev server, run the suite, read the failure, find the line, fix it, run again. That's the most expensive possible moment to find a missing keyword, for a person and even more so for an agent paying for every step in tokens.

Writing a rule a third time doesn't make the model more likely to follow it. A program checking for it does.

## The ladder: from hope to guarantee

The fix was to take each rule and move it down a ladder, from "the model has to remember" to "a program verifies it":

| Step | Who checks | When you find out |
|---|---|---|
| Prose in the instructions | The model, if it remembers | After a full test run, if at all |
| Type check | The compiler | Seconds |
| Linter | A lint rule | Seconds, often fixed automatically |
| Structured tool output | The tool itself | One read, no guessing |

Each step down is cheaper and more reliable than the one above it.

### Step 1: run the compiler you already have

A lot of what an agent gets wrong is calling an API the wrong way: a misspelled option, arguments in the wrong order, a method from a different library. If your API is typed, all of those are already compile errors.

My agent just never ran `tsc`. Now its instructions say: type-check the files you wrote before the first test run. One line, and a whole category of mistakes is caught in seconds, without starting anything.

### Step 2: lint what the types can't see

Some mistakes are perfectly valid code:

```ts
page.visit('/todos')                       // forgot the await
import { describe, it } from 'vitest'      // wrong test framework for this runner
it.only('creates a todo', ...)             // silently skips every other test
```

The type checker is happy with all three. A linter isn't. So I wrote one for my library, with a handful of rules for exactly the mistakes the agent kept making, and the agent now runs it after the type check, with `--fix`.

Two details made a big difference:

- **Autofix the safe cases.** Adding a missing `await` inside an `async` function is always correct, so the linter just does it.
- **Write messages that say what to do.** Not "invalid usage at line 33", but the cause and the fix in one sentence. The agent reads the message, and its next action is right there. So does the human.

### Step 3: give the agent data, not logs

The last step is the output of your tools. An agent reading a console log will grep for checkmarks, count lines, and occasionally get it wrong. My test runner writes a JSON report on every run: the outcome, each failed test with its error, which network mocks were never used. The agent reads a file instead of guessing from text.

## The instructions got shorter, but not empty

With those checks in place, I removed the repetition, following one rule:

**The instructions teach the correct form once, in positive form, with an example. The tooling makes sure it's followed.**

That distinction matters. There are two kinds of text in agent instructions:

- **Knowledge**: how the API works, what things return, complete examples. No linter replaces this. If the model doesn't know your library, this is the only place it can learn it.
- **Policing**: the repeated "never do X". This is the part the tooling replaces.

The policing went away. The words `NEVER`, `WRONG` and `ALWAYS` went from 13 occurrences to 1. A "write tests" request now loads 32 KB of instructions instead of 56 KB.

But the bigger saving isn't in the instructions. One failed run caused by a missing `await` costs more tokens than any paragraph: the run, the report, the diagnosis, the fix, the re-run. Every mistake caught by the compiler or the linter is a loop that never happens.

## A linter can't believe something false

My favourite part of this story is a rule that turned out to be wrong.

Rule number one in my instructions, in capitals, was: **"ONE top-level `describe()` per file. Multiple top-level describes break the test runner."**

So the first version of the linter had a rule for it. I ran it against every project using the library: 494 test files across React, Vue, Angular, Svelte and others.

It reported 44 files. Every one of those tests ran and passed.

I read the runner's code. It handles any number of top-level blocks. The rule I had given the agent, at the very top, for months, was a style preference with a made-up reason. The agent obeyed it faithfully, and nobody ever checked it.

That's the deeper problem with prose: it can say anything, and nothing verifies it. A lint rule has to survive real code. This one didn't, so it was removed, and the instructions now call it what it is, a convention.

The rules that survived were worth it. Across those 494 files there were no false positives, and every report was a real bug, including dozens of missing `await`s and assertions that had never actually run because nobody awaited them. Some of those were in code written by people, long before any agent.

## What stays prose

Not everything can move down the ladder. "Set up the mock before the page loads" depends on when the app makes its request, and that isn't visible in the test's source. "Reset the store between tests" depends on the app. Those stay in the instructions, written once, with an example.

That's fine. The goal isn't zero prose. The goal is that prose only carries what a program can't check.

## The takeaway

If you maintain a skill, an `AGENTS.md`, a `CLAUDE.md` or a system prompt, go through it rule by rule and ask:

1. **Could the compiler catch this?** Have the agent run it before anything else.
2. **Could a linter catch this?** Use an existing rule or write one, with a message that says how to fix it.
3. **Could the tool report this?** Give the agent structured output, not logs.
4. **None of the above?** Keep it in prose. Once, in positive form, with an example.

Telling the model three times and hoping doesn't work. Tell it once and check.
