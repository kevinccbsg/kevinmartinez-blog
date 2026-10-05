---
title: Stop Letting AI Write Untestable Code. Add Determinism Back with TWD
description: >-
  The /twd:setup skill analyzes your project and generates a patterns file that
  teaches your AI agent how tests are structured in your codebase — turning
  generic AI-written tests into ones that actually fit your conventions.
tags:
  - testing
  - twd
  - ai
  - webdev
series: TWD AI Workflow
date: '2026-03-17'
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fa1tg69fce31syu5i84lt.png
devto_url: >-
  https://dev.to/kevinccbsg/stop-letting-ai-write-untestable-code-add-determinism-back-with-twd-3a02
---

Now that AI is generating a big portion of our frontend code, speed is no longer the main bottleneck.

**Confidence is.**

We’ve seen this before: when teams wanted to move fast, the real enabler wasn’t “more code” — it was **having a solid testing strategy** that allowed safe refactoring and iteration.

That hasn’t changed. If anything, it’s **more important now**.

In previous posts, I talked about the TWD philosophy, but one idea is key here:

> Test what you own. Mock what you don’t.

With this mindset, **TWD (Test While Developing)** lets you create **deterministic UI tests**, where you fully control the environment, simulate any scenario, and avoid flaky behavior.

---

## The Problem: Allow AI Know Your Project

AI can write tests… but not your tests.

It doesn’t know:

- how your project is structured
- what should be mocked
- how your auth works
- what “good tests” look like in your codebase

So even if it generates tests, they often:

- don’t follow your patterns
- mock the wrong things
- miss important flows

## The Solution: TWD + Skills

To solve this, we introduced TWD skills inside a [Claude Code plugin](https://github.com/BRIKEV/twd-ai).

These skills give the AI:

- context about your project
- rules to follow
- patterns to reuse

So instead of generic tests, you get tests that actually fit your codebase.

---

## /twd:setup — The Most Important First Step

Everything starts here:

```plaintext
/twd:setup
```

This is an interactive setup that analyzes your project and creates:

```markdown
.claude/twd-patterns.md
```

This file becomes the source of truth for how tests should be written.

---

## What /twd:setup Does

- Detects your framework, Vite config, entry points, CSS setup
- Asks about:
  - auth & permissions
  - API structure
  - third-party dependencies
  - state management
- Generates a project-specific testing config
- Optionally installs and configures TWD for you

## How It Looks in Practice

You just run:

```plaintext
/twd:setup
```

And the agent starts understanding your project:

![prompt using twd:setup skill](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/upznvqpagu4mcjewn26g.png)

It will ask the right questions to understand how your app works and detect your frontend configuration:

- What should be mocked?
- How does auth behave?
- Where are your services?

![First questions](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/zuhitpw6qzc6swl9xyf4.png)

Once completed, it generates your config file:

```markdown
.claude/twd-patterns.md
```

This is **critical** — every future test uses this as context.

---

If something is outdated, it will even suggest improvements:

![Asking to improve current configuration](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/cgj09nb4umm91o51wyoc.png)

---

And when it's done, it guides you to the next step:

![Message recomendating the next step using the twd-tester skill](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/j5lph0uj1832faglw38j.png)

## Why This Matters

Without this step, AI-generated tests are:

- generic
- inconsistent
- sometimes useless

With `/twd:setup`, tests become aligned with your architecture.

The plugin also includes skills for:

- automatic test generation
- CI setup
- test quality analysis
- test gap detection
- flow visualisation

We’ll cover those in future posts.

---

## Final Thought

AI can make you faster.

But tests are what let you keep that speed without breaking everything.

If you care about frontend quality in the AI era, don’t just generate code:

> Generate confidence.

Agent conversation:

[View the agent session on dev.to](https://dev.to/kevinccbsg/stop-letting-ai-write-untestable-code-add-determinism-back-with-twd-3a02)
