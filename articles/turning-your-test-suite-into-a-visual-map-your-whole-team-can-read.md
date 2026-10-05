---
title: Turning Your Test Suite Into a Visual Map Your Whole Team Can Read
description: >-
  The final piece of the TWD AI workflow — /twd:test-flow-gallery generates
  Mermaid flowcharts and business-friendly summaries from your test files,
  making coverage visible to developers, product, and QA alike.
date: '2026-04-19'
tags:
  - testing
  - twd
  - ai
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F0o13mgoi8566njg4ti7c.png
devto_url: >-
  https://dev.to/kevinccbsg/turning-your-test-suite-into-a-visual-map-your-whole-team-can-read-2835
---
You have written the tests. The CI pipeline runs them. The gap analysis has helped you fill the blind spots. Quality checks are passing. The work is solid.

And yet — ask a product manager what your test suite actually covers, and you will get a blank stare. Ask a new developer which user flows are tested, and they will spend an hour reading test files to piece it together. Ask QA to verify the coverage makes sense, and they will ask for a document that does not exist.

This is the last problem the TWD AI workflow solves. And it is not a small one.

## The Gap Between Tests and Understanding

Test code is written for machines to execute. It is dense, technical, and full of implementation detail. A test that reads:

```javascript
await twd.mockRequest('getTodos', { method: 'GET', url: '/api/todos', response: [{ id: 1 }, { id: 2 }], status: 200 });
await twd.mockRequest('createTodo', { method: 'POST', url: '/api/todos', response: { id: 3 }, status: 201 });
await twd.visit('/todos');
await twd.waitForRequest('getTodos');

const user = userEvent.setup();
const titleInput = await screenDom.findByLabelText('Title');
await user.type(titleInput, 'New todo');
const descInput = await screenDom.findByLabelText('Description');
await user.type(descInput, 'A new task');
const dateInput = await screenDom.findByLabelText('Date');
await user.type(dateInput, '2026-04-15');
const createButton = await screenDom.findByRole('button', { name: /create todo/i });
await user.click(createButton);

const rule = await twd.waitForRequest('createTodo');
expect(rule.request).to.deep.equal({ title: 'New todo', description: 'A new task', date: '2026-04-15' });
```

...tells a developer exactly what is being tested. It tells a product manager nothing. And for a new team member, figuring out what user journeys are covered means reading through dozens of files like this and piecing it together mentally.

The `/twd:test-flow-gallery` skill generates that picture for you.

## What the Skill Produces

Running `/twd:test-flow-gallery` in Claude Code (with the [TWD AI plugin](https://github.com/BRIKEV/twd-ai) installed) analyzes your TWD test files and generates two things for each test file it finds:

**Mermaid flowcharts** — one per test case. Each chart uses a consistent visual grammar:
- Blue rectangles for user actions (clicks, form inputs, navigation)
- Green hexagons for assertions (what the test verifies is true)
- Separate subgraphs for API calls made during the test

**Business-friendly summaries** — plain language descriptions of what each test verifies. No function names, no selector syntax. Just: "A user fills out the create todo form with a title, description, and date, then clicks Create Todo. The form data is sent to the server as a new todo."

Here is an example of the flowchart generated from the code above:

<!-- ADD IMAGE HERE -->

The result is a `.flows.md` file colocated next to each test file, plus a root-level index that gives you a single navigation point across the entire test suite.

## Who Actually Benefits From This

**New developers** can understand what is covered without reading a single line of test code. On day one, they can open the flow gallery and see the user journeys the team has validated. That is faster onboarding and fewer "wait, is this tested?" conversations in code review.

**Product teams** finally have visibility into testing. Not a coverage percentage — an actual map of user journeys. When they ask "are we testing the checkout flow?", the answer is a link, not a meeting.

**QA engineers** can identify gaps at a glance and verify that what is visually described matches what they expect to be covered. They can spot missing edge cases by looking at the flows rather than reading assertions.

## Running It

With the TWD AI plugin installed, you run:

```plaintext
/twd:test-flow-gallery
```

That is it. The skill finds your TWD test files, processes them, and writes the `.flows.md` files alongside your tests. The root index is placed at a predictable location so you can link to it from your README or project wiki.

The flowcharts use standard Mermaid syntax, which renders natively on GitHub, GitLab, Notion, and most modern documentation tools. No extra dependencies, no build step.

## The Complete TWD AI Workflow

This skill is the finale of a six-step workflow that takes you from zero to a fully automated, AI-assisted testing practice:

1. **`/twd:setup`** — Scaffolds the TWD testing environment in your project
2. **`/twd` (twd skill)** — AI agent that writes and runs in-browser tests against live components
3. **`/twd:ci-setup`** — Wires your tests into CI/CD with the headless runner
4. **`/twd:test-gaps`** — Identifies untested user flows and generates missing tests
5. **`/twd:test-quality`** — Reviews your tests for reliability, false positives, and maintenance burden
6. **`/twd:test-flow-gallery`** — Turns your test suite into visual documentation for the whole team

Each step builds on the last. The result is a test suite that is not just green in CI — it is legible, maintainable, and understood by everyone who needs to understand it.

## Try It

The TWD AI plugin is open source and available at [github.com/BRIKEV/twd-ai](https://github.com/BRIKEV/twd-ai). The full TWD documentation, including the philosophy behind test-while-developing, is at [twd.dev](https://twd.dev).

If you have been following this series, you now have the full picture. If you are coming to this article first — the rest of the series walks through each step in detail. Start at the beginning and build the workflow incrementally.

Testing should not be a black box. Your team deserves to see what is covered.
