---
title: Your Tests Are Running — But Are They Covering the Right Things?
description: >-
  The /twd:test-gaps skill scans your project to find untested and
  partially-tested routes, classifies them by risk, and tells you exactly where
  to focus next.
date: '2026-04-19'
tags:
  - testing
  - twd
  - ai
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fxd1c58envzvyrhxuw3s9.png
devto_url: >-
  https://dev.to/kevinccbsg/your-tests-are-running-but-are-they-covering-the-right-things-55hc
---
You've wired up your test suite. CI is green. You're shipping. And then a bug lands in production on a route nobody thought to test.

It's not that your tests are bad. It's that you didn't know what was missing.

That's the problem `/twd:test-gaps` is built to solve.

## The gap between "tests exist" and "tests are enough"

Most coverage tools tell you about lines and branches. What they don't tell you is: which user-facing routes have zero test coverage? Which pages have a test that visits them but never clicks anything, never submits a form, never triggers a mutation?

There's a difference between a test that loads a page and a test that actually exercises it. A route can show up as "covered" while the core interaction — the form submission, the delete confirmation, the role-based redirect — is completely untested.

`/twd:test-gaps` makes that distinction explicit.

## What the skill actually does

When you run `/twd:test-gaps`, the [TWD plugin](https://github.com/BRIKEV/twd-ai) does three things in sequence:

**Route discovery.** It reads your project and finds every route your app exposes. It doesn't require a specific framework — it detects routes from router config files, page component patterns, and URLs referenced in existing test files. Angular, React Router, Vue Router, SolidJS: it handles all of them.

**Coverage classification.** For each discovered route, it checks the test files and assigns one of three states:

```plaintext
Tested          — has twd.visit() + userEvent interactions (clicks, inputs, submits)
Partially tested — has twd.visit() but missing interaction or mutation coverage
Untested         — no test file references this route at all
```

The partially-tested category is where this gets valuable. These are routes that feel covered but aren't. A smoke test that visits `/settings` and checks the heading renders is not the same as a test that changes a password, hits submit, and verifies the API call was made.

**Risk assessment.** The skill reads your component code and scores each untested or partially-tested route as HIGH, MEDIUM, or LOW risk based on what it finds:

- HIGH: mutations (form submissions, delete actions, state changes), financial handling, permission checks
- MEDIUM: complex UI interactions, multi-step flows, conditional rendering logic
- LOW: static pages, read-only views, simple display components

The output is a prioritized list. You know exactly where the exposure is.

## A real example

Say you have a `/checkout` route. The skill visits the component, sees a form with payment fields and a submit handler that calls an API. It checks your test files — finds a test that visits the route but only asserts that the page renders. No form interaction. No API mock.

The result:

```plaintext
/checkout — PARTIALLY TESTED — HIGH RISK
  Missing: form submission, mutation mock for POST /api/orders
```

That's the information you need to act on.

## From gap to green

Once you have the report, the next step is straightforward: run `/twd` on the high-priority routes and let the agent write the missing tests.

The flow is:

1. Run `/twd:test-gaps` to get the prioritized gap report
2. Run `/twd` on HIGH-risk untested or partially-tested routes
3. Tests are written, run, and fixed until green
4. Repeat for MEDIUM-risk routes as capacity allows

You're not guessing anymore. You have a concrete list, sorted by risk, and a tool that can write the tests you point it at.

## Why this matters more than line coverage

Line coverage tells you what code ran during your tests. It doesn't tell you whether the right things were asserted, whether the interactions were real, or whether the routes that users actually care about are exercised.

A codebase can have 85% line coverage and a completely untested checkout flow.

`/twd:test-gaps` focuses on user-facing behavior: the routes, the interactions, the mutations. It asks the question your users would ask — "what happens when I do this?" — and finds the places where no one has answered it yet.

## What's next

The next article in this series covers `/twd:test-quality` — a skill that goes beyond gap detection and grades the quality of your existing tests. Not just whether a route is tested, but whether the test is actually asserting the right things, using the right patterns, and giving you confidence you can rely on.

If you're curious about the TWD plugin and want to try it yourself, the full source is at [https://github.com/BRIKEV/twd-ai](https://github.com/BRIKEV/twd-ai).
