---
title: Your AI Doesn't Just Write Tests. It Runs Them Too.
description: >-
  The /twd skill writes tests, executes them in your real browser via WebSocket,
  reads the results, and fixes failures automatically. Here's how the
  write-run-fix loop works.
date: '2026-04-19'
tags:
  - testing
  - twd
  - ai
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F176a4krevqbfin2roidi.png
devto_url: >-
  https://dev.to/kevinccbsg/your-ai-doesnt-just-write-tests-it-runs-them-too-1a5b
---
In the [previous article](/posts/stop-letting-ai-write-untestable-code-add-determinism-back-with-twd), we talked about `/twd:setup` — the skill that analyzes your project and generates `.claude/twd-patterns.md`, a file that teaches your AI agent how tests are structured in your codebase. That was about giving the agent context.

This one is about what the agent actually does with it.

## Writing Tests That Run in Your Real Browser

Most AI-generated tests run in Node.js — against jsdom, a simulated DOM. That works for a lot of things, but it is not the same as running inside your actual application with real components, real routing, and real network mocks in place.

TWD tests run in the browser. They execute inside your running app, against the real DOM, with your actual component tree mounted. And the `/twd` skill — part of the [TWD AI plugin](https://github.com/BRIKEV/twd-ai) — takes that a step further. It writes the tests, runs them in your browser, reads the results, and if something fails, it fixes the code and runs again.

Here's the full cycle:

1. **Write** — the agent reads your `.claude/twd-patterns.md` to understand your project's test conventions, then generates a test that follows those patterns
2. **Execute** — the test is sent to your browser via `twd-relay`, a WebSocket relay that connects the agent to the TWD sidebar running in your app
3. **Read results** — pass/fail status comes back as plain text with error details (no screenshots, no DOM dumps — just the signal you need)
4. **Fix and re-run** — if a test fails, the agent reads the error, adjusts the test, and re-executes

This loop runs automatically. You're not involved until it's done.

## How the Relay Works (Without Getting Heavy)

One thing that surprised me about this setup is how lightweight it is.

`twd-relay` uses a WebSocket connection between the agent and the browser. When the agent wants to run tests, it sends a command through the relay. The browser executes the tests inside the running app — against the real DOM, with your mocked API responses in place, and the real component state.

Results come back as text. Not screenshots. Not serialized DOM trees. Just: did it pass, and if not, what was the error message.

This keeps token usage remarkably low. The agent is essentially getting the same output you'd see in a terminal — concise, structured, actionable.

## Running It Before You Build

The recommended workflow is test-first. Run `/twd` before you implement a feature.

```plaintext
/twd Write a test for the checkout form — it should verify that submitting with an empty email shows a validation error
```

The agent writes the test based on your existing patterns, runs it in the browser, and it fails — because the feature doesn't exist yet. That's expected. The test is now a specification.

You implement the feature. The test passes. You didn't have to think about test structure, selectors, or mock setup. The agent handled that using the patterns it already knows from your project.

## What Happens When a Test Won't Pass

Not every test is fixable on the first attempt. Sometimes the agent hits a case it can't resolve — a component that behaves differently than expected, or a pattern that doesn't quite translate.

The `/twd` skill handles this with a hard limit: if a test still fails after three fix attempts, it's marked as `it.skip` and left in the file with a comment. It doesn't block the rest of the test run. You can come back to it, investigate the real issue, and decide how to handle it.

This is important for trust. An agent that quietly hides failures is dangerous. One that skips and surfaces them is honest.

## Keeping Your Conversation Clean

The `/twd` skill runs in a forked context — meaning the test iterations, failed attempts, and fix cycles happen separately from your main conversation. When it finishes, you get a summary of what passed, what was skipped, and what files were created. You don't have to scroll through 30 messages of debugging to see the result.

## A Concrete Example

Say you're building a Vue component that fetches and displays user data. You invoke:

```plaintext
/twd Write tests for the UserProfile component
```

Behind the scenes:

1. The agent reads `.claude/twd-patterns.md` — it knows your project conventions, how to mock API endpoints with `twd.mockRequest()`, and which selectors to use with `screenDom`
2. It generates tests that mock the `/api/users/:id` endpoint, visit the page, and assert the displayed data
3. It runs them in your browser via the relay
4. One test fails — the agent used a selector that doesn't match your actual markup
5. It reads the error, corrects the query, re-runs
6. All tests pass

Total time: less than two minutes. No manual intervention.

## What You Actually Need to Get Started

- The TWD sidebar running in your app (from `twd-js`)
- `twd-relay` running locally
- `.claude/twd-patterns.md` generated by `/twd:setup`
- The `/twd` skill installed from [twd-ai](https://github.com/BRIKEV/twd-ai)

That's it. The relay handles the browser connection, the patterns file handles the conventions, and the skill handles the rest.

## Coming Next: CI Setup

Writing and running tests locally is one half of the equation. The other half is making them part of your CI pipeline — so tests run headlessly on every push, without a browser in sight.

The next article in this series covers `/twd:ci-setup`, which configures your project to run TWD tests in CI using the headless CLI runner. If you've ever wanted your AI-written tests to gate a deployment, that's the one you want.
