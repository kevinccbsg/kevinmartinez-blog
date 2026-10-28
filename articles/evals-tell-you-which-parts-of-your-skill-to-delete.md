---
title: Evals tell you which parts of your skill to delete
description: >-
  Skills only grow. Every bug adds a line and nobody removes one, because
  nobody knows which lines still matter. Running each case with and without the
  skill answers that, per model, and the cost per run tells you what the extra
  lines are costing.
date: '2026-10-28'
tags:
  - ai
  - claudecode
  - testing
  - productivity
series: Evals for Claude Code skills
---
> A rule the model follows without being told is a rule you're paying to repeat.

Skills grow in one direction. The agent forgets an `await`: add a line. It mocks the wrong thing: add a paragraph. A new model ships, the old problems stop happening, and the lines stay, because nobody knows which of them are still doing something.

In the [first article](https://kevinmartinez.dev/posts/i-tried-it-and-it-worked-is-not-a-test-for-your-claude-code-skills/) I described how `claude plugin eval` runs every case twice, with your plugin and without it. That second run is the tool for this problem. It measures what the model already does on its own.

## What the model does without you

These are the eight cases of [twd-ai](https://github.com/BRIKEV/twd-ai), the plugin I use as the example, on Opus 5.5. Three runs per case, same judge for every run.

| Case | With | Without | Δ |
|---|---|---|---|
| Set the library up in a project | 1.00 | 0.10 | +0.90 |
| Write the CI workflow | 1.00 | 0.30 | +0.70 |
| Test a component in isolation | 1.00 | 0.50 | +0.50 |
| Get a failing suite green | 1.00 | 0.60 | +0.40 |
| Fix a hand-written test with lint errors | 1.00 | 0.86 | +0.14 |
| Write page flow tests | 0.97 | 0.87 | +0.10 |
| Replace a third-party component with a fake | 1.00 | 1.00 | 0.00 |
| Stay out of a unit-test request | 1.00 | 1.00 | 0.00 |

The top of the table is where the skills earn their place. Without them, Opus sets the library up from what it remembers, and what it remembers is out of date. The bottom is where Opus already does the job on its own. The last case is different: it checks that the skill stays out of a request it isn't for, so its Δ is always 0.

## Knowledge and discipline

The table splits along a line I wrote about in [Your library isn't in the training data](https://kevinmartinez.dev/posts/your-library-is-not-in-the-training-data-making-ai-agents-use-it-well/).

A **knowledge** rule teaches the model something it can't know: your library's config, your project's conventions, the helper your team always uses. Its Δ is large and stays large, because no new model will have learned your internal conventions.

A **discipline** rule reminds the model of something it already knows how to do: run the filtered test first, read the report, don't touch the app. Its Δ is small, depends on the model, and shrinks with every release.

The third-party component case is the clearest example. The skill explains how to replace a component with a fake, but the library's public API for that is in Opus's training data. Δ is 0.

## What the extra lines cost

Every run also records its cost and turns. That changes the question from "does this rule help?" to "what does this rule cost when it doesn't?"

| Case, Opus | Score with / without | Cost with / without | Turns with / without |
|---|---|---|---|
| Replace a third-party component | 1.00 / 1.00 | $0.38 / $0.24 | 15 / 10 |
| Set the library up | 1.00 / 0.10 | $0.36 / $0.18 | 21 / 7 |

Both cases cost more with the skill. They mean opposite things.

In the component case, the score is the same and the skill makes every run 57% more expensive, with five extra turns. For Opus, there the skill is pure cost.

In the setup case, the skill doubles the cost, and without it the setup is wrong. That extra cost is what doing it right costs. Fewer turns and a lower bill only mean something when the score is the same.

## Don't delete for one model

Before deleting the component instructions, look at the same case on the other models:

| Replace a third-party component | Δ |
|---|---|
| Opus 5.5 | 0.00 |
| Sonnet 5.5 | +0.29 |
| Haiku 5.5 | +0.48 |

The smaller the model, the more the skill adds. The rule Opus doesn't need is the one Haiku needs most. So the question isn't "is this rule useful?" but "is it useful for the models my users run?"

The rule I follow now: a section is a candidate for deletion when its Δ is near zero on **every** model I support. Then I delete it and run the suite again. The score with the plugin has to stay where it was. If it drops, the section was doing something the Δ didn't show, and it goes back.

It's TDD in reverse: the eval stays green while the skill gets shorter.
