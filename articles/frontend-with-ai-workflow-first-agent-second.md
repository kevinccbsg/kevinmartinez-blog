---
title: 'Frontend with AI: workflow first, agent second'
description: >-
  AI only amplifies what your team already does. Define the workflow first, turn
  the AI on second, and let TWD run the tests inside the browser tab you already
  have open. Here's the full anatomy.
date: '2026-05-17'
tags:
  - ai
  - testing
  - frontenddev
  - twd
devto_url: 'https://dev.to/kevinccbsg/frontend-with-ai-workflow-first-agent-second-3hmo'
---
> If you're about to plug AI into your team's frontend, define the process before you let it loose. Without a workflow, what gets faster isn't delivery. It's technical debt.

At [Orbitant](https://www.orbitant.com) we run a development consultancy, and we've spent months refining a concrete workflow for integrating AI into the day-to-day of the frontend teams we work with, adapting it to each client's stack and constraints. The idea isn't new, but the nuance matters: AI only amplifies what your team already does. If you already had a quality process, speed goes up and quality holds. If not, what goes up is the amount of code without tests, without context, and without review.

That was the starting point.

## The problem: AI amplifies what you already have

Before AI was part of the flow, in any tight sprint the usual story played out: focus on the happy path, push tests to next week, close the ticket. AI didn't change that. It sharpened it. More code per hour meant more uncovered paths, more untested components, more silent decisions nobody was going to review.

A team figures this out fast. The problem isn't the tool. It's that there's no mandatory process the AI has to respect.

## The proposal: define the workflow first

The opening rule is simple: if we take AI out of the picture, quality, relative speed, and regression control all have to stay exactly where they were. AI on top of a good process amplifies results. On top of a broken one, it amplifies problems.

So first you define the path. Then you build a Claude Code skill that orchestrates that path step by step. Everyone goes through the same hoop. With or without AI.

## The piece that makes it click: TWD

A workflow like this only works if the tool running the tests also respects the process. [TWD](https://twd.dev) (*Test While Developing*) does exactly that: it runs the tests inside your own dev server, against the same DOM and the same mocks you're looking at right now in the browser. No simulations, no jsdom, no separate Chrome under the hood.

That fits with AI for a very specific reason: results come back as text. The agent reads whether the test passed or failed, reads the error if there is one, and retries. No heavy screenshots, no DOM dumps. The loop costs few tokens, so it's viable to repeat it hundreds of times a day without the bill exploding. And test quality goes up because the tests stop being "a component mounted in isolation". They become what the user is going to see in the real app, with its real components and real interactions.

## The flow, phase by phase

![Workflow anatomy: a six-phase timeline, the TWD live loop, and the four non-negotiables](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/xjpe39wr2166r30f43hq.png)

It's six phases, but in practice it simplifies to four mental blocks:

1. **Understand the ticket properly.** Figma, screenshots, brainstorm if the feature is complex. The clearer the start, the better the implementation. The skill can pull from the Figma MCP when there's design, and break out into a separate brainstorm if the thing looks fuzzy.
2. **RED → GREEN, non-negotiable.** Tests come first, from the requirements. When a test fails, you fix the implementation, never the test. No guess-coding. If after three attempts a test is still red, mark it as `it.skip` with a TODO. Never silence.
3. **TWD live loop.** The part people like most when they see it for the first time. The agent sends tests to the browser tab you already have open: no separate Chrome, no new window, no simulated environment. Your tab, your app, your mocks. You watch the clicks, the forms, and the redirects happen in real time while the agent reads the results as text and decides the next step. (The technical piece connecting agent and browser is called `twd-relay`; details at [twd.dev](https://twd.dev) for anyone who wants them.)
4. **Reviewer.** Before closing, a subagent runs lint, build, and the full suite. If anything breaks, back into the loop. The feature isn't done until everything is green.

The bottleneck moves. From "writing code" to "deciding what you want and reviewing what comes out". Which is exactly where we want it.

## The rules for structuring tests

The workflow is the kitchen; the rules are the recipe. These are the four non-negotiables that come up in any team conversation:

- **Test what you own, mock what you don't.** Tests cover what you control. What you don't (third-party iframes, external SDKs, cross-origin widgets) gets mocked, documented as out of scope, and covered from the QA layer with real E2E or manual tests. It doesn't disappear, it gets tested somewhere else.
- **Flow-based tests, not element-based.** Each `it()` covers a complete journey: visit, interact, assert the outcome. One test per element is noise, not signal.
- **Test first, code second.** Non-negotiable, even when "it's just a small change". Small changes break the system; tests take minutes.
- **A test that passes without an implementation is suspect.** Either it's testing pre-existing behavior (justify it) or it's testing nothing. Either way, look at it.

These rules didn't come from a manual. They came from looking at what broke in previous sprints and putting a brake at each point.

## Closing

If your team is about to put AI into frontend, the real decision is this: what process do you want the AI to amplify?

An agent without a process is a developer in a hurry. An agent inside a workflow is a colleague that respects the same rules as the rest of the team. The difference shows up the first time a regression doesn't reach production.

Looked at from outside, this is *harness engineering* applied to a software process: the harness doesn't just call the model, it enforces a workflow the team already considered good before AI showed up.

> first the failing test → then the most obvious implementation that passes
