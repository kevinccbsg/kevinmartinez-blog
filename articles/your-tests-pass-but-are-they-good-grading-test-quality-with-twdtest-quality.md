---
title: >-
  Your Tests Pass. But Are They Good? Grading Test Quality with
  /twd:test-quality
description: >-
  Writing tests is easy. Writing tests that actually catch bugs is harder. The
  /twd:test-quality skill grades your test files across four dimensions and
  tells you exactly what to fix.
date: '2026-04-19'
tags:
  - testing
  - twd
  - ai
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fjfpfs2bekfgu842lsgzc.png
devto_url: >-
  https://dev.to/kevinccbsg/your-tests-pass-but-are-they-good-grading-test-quality-with-twdtest-quality-2077
---
## The Problem With "We Have Tests"

There is a moment in every project where someone says "we have tests" like it settles the matter. The CI pipeline is green. The coverage number is somewhere north of 70%. Everything is fine.

Until a bug slips through. Not because the tests failed — but because they never really covered what broke.

This is the gap between having tests and having good tests. A test that checks whether a button is visible tells you almost nothing about whether your application works. A test that checks whether clicking "Submit" fires the right API call with the right payload — that test is doing real work.

The `/twd:test-quality` skill is built for exactly this problem. It reads your existing test files, grades them across four weighted dimensions, and hands you a concrete list of what to improve.

## What Gets Graded

Every test file gets scored across four dimensions. Each one targets a distinct failure mode in how developers tend to write tests under time pressure.

**Journey Coverage (35%)** — This is the heaviest dimension, and for good reason. A test suite full of isolated "does X render?" checks does not tell you whether the user can actually complete a task. Journey coverage looks for complete workflows: does the test cover the sequence of actions a user would take to accomplish something, or does it stop after the first visible element?

**Interaction Depth (20%)** — Variety matters. If all your tests do the same kind of interaction — say, only clicking buttons — you are missing a significant portion of how real users engage with your UI. This dimension checks for the range of input types and interaction patterns exercised.

**Assertion Quality (25%)** — This is where most test suites quietly fail. Assertions that check CSS classes or element visibility feel like verification, but they do not confirm that your application's logic is correct. Strong assertions check actual outcomes: API payloads, state changes, content that results from a specific action. Loose assertions let bugs pass silently.

**Error and Edge Cases (20%)** — The happy path is always tested. What about the unhappy path? Empty states, boundary values, API failures, form validation — these are the scenarios that surface in production and are almost never covered by a first-pass test suite.

## How the Skill Works

Point the skill at your test directory and it will evaluate each file independently. The output is direct: a letter grade (A through D), a weighted overall score, and — for anything below an A — two or three specific, actionable suggestions.

```plaintext
/twd:test-quality src/tests/
```

A typical output might look like this:

```plaintext
invoice-form.test.js — C (62/100)

Journey Coverage: D — Tests check that fields render, but no test submits
the form and verifies the result.

Assertion Quality: C — Assertions rely on element visibility. No tests
verify the POST payload or the success state.

Suggestions:
1. Add a test that fills the form and submits it, then asserts the API
   received the correct invoice payload.
2. Add a test for the error state when the API returns a 422.
3. Verify the confirmation message content, not just its presence.
```

The score is not the point. The suggestions are.

## From Analysis to Action

Once you have the quality report, the workflow is immediate. You run `/twd` on the same files — the core TWD test-writing skill — and it uses the suggestions as its implementation brief.

The quality skill diagnoses. The test skill fixes. You do not have to manually translate "assertion quality is weak" into new test code — that handoff happens automatically.

This is the pattern that makes AI-assisted testing practical rather than cosmetic. The AI is not writing tests from scratch based on a vague request. It is working from a structured diagnosis of what is actually missing.

## What This Looks Like in Practice

Here is what a realistic before-and-after looks like for a form component:

Before — a typical first-pass test:

```javascript
it('renders the submit button', async () => {
  await twd.visit('/invoices/new');
  const button = screenDom.getByRole('button', { name: /submit/i });
  expect(button).to.be.visible;
});
```

After — the same component, improved by the quality feedback:

```javascript
it('submits a valid invoice and shows confirmation', async () => {
  await twd.mockRequest('createInvoice', {
    method: 'POST',
    url: '/api/invoices',
    response: { id: 'inv_001' },
    status: 201,
  });

  await twd.visit('/invoices/new');
  const user = userEvent.setup();
  await user.type(screenDom.getByLabelText(/amount/i), '1200');
  await user.click(screenDom.getByRole('button', { name: /submit/i }));

  const rule = await twd.waitForRequest('createInvoice');
  expect(rule.request).to.deep.equal({ amount: 1200, currency: 'EUR' });
  screenDom.getByText(/invoice created/i);
});
```

The second test is not dramatically more complex. It is just more intentional. It verifies behavior, not presence.

## Getting Started

The `/twd:test-quality` skill is part of the [TWD AI plugin for Claude Code](https://github.com/BRIKEV/twd-ai). If you have the plugin installed, you can run a quality audit on any test directory immediately.

Start with your most critical feature area. Look at what the grader flags as weak on assertion quality and journey coverage — those two dimensions are usually where the highest-value improvements are hiding.

The tests that catch bugs in production are not the ones you wrote fastest. They are the ones that actually exercise the path that breaks.

---

Next in the series: the Test Flow Gallery — a curated set of reusable test patterns for common UI scenarios, so you are not writing from scratch every time.
