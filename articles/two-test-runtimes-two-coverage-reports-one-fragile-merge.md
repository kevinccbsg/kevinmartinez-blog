---
title: 'Two test runtimes, two coverage reports, one fragile merge'
description: >-
  Two test runners means two coverage outputs and a fragile merge step. Running
  both styles in TWD collapses them into a single report.
date: '2026-05-04'
tags:
  - testing
  - twd
  - coverage
  - playwright
devto_url: >-
  https://dev.to/kevinccbsg/two-test-runtimes-two-coverage-reports-one-fragile-merge-1h2a
---
You have unit tests in Vitest (or Jest). You have E2E tests in Playwright. CI runs both. Coverage works for each, until you try to look at a single number.

Then it gets weird.

## Two runtimes, two coverage outputs

Unit tests run in Node, instrumented by V8 or istanbul. Playwright runs your real app in a real browser. Each produces its own coverage data. Stitching them together usually means:

- `nyc merge` (or a custom step) combining `coverage-final.json` files
- Reconciling source maps between Vitest's transform pipeline and Playwright's
- Hoping both tools agree on file paths

It works, until it doesn't. A path mismatch silently drops files from the merged report. A Playwright run on a different Node version emits slightly different paths. Coverage drops by 12% and nobody knows why.

The deeper issue: you're not really merging coverage. You're merging _evidence_ that two different runtimes touched the same lines. The merge step is a heuristic.

## What TWD does differently

[TWD](https://twd.dev) runs both styles of test in the same environment, your app's Vite dev server, one browser, one execution context.

A flow test exercises the page through the DOM:

```ts
import { twd, userEvent, screenDom } from "twd-js";
import { describe, it } from "twd-js/runner";

describe("checkout", () => {
    it("submits the order", async () => {
        await twd.visit("/checkout");
        await userEvent.click(screenDom.getByRole("button", { name: /pay/i }));
        // ...
    });
});
```

A unit test imports the function and asserts directly:

```ts
import { expect } from "twd-js";
import { describe, it } from "twd-js/runner";
import { normalizeOrder } from "@/utils/normalizeOrder";

describe("normalizeOrder", () => {
    it("defaults quantity to 1 when missing", () => {
        const result = normalizeOrder({ items: [{ sku: "ABC" }] });
        expect(result.items[0].quantity).to.equal(1);
    });
});
```

Same `describe`, same `it`, same `expect`. Same browser. Same coverage source.

There's no merge step because there's nothing to merge.

## When to reach for which

Flow tests are most important and valuable. They cover real user behaviour, routes, interactions, mutations. They catch the bugs your users would actually hit.

Unit tests fill the gaps flow tests can't reach. A pure utility with seven branches in a switch statement isn't worth seven Flow tests, but it's worth covering. Drop it in a `unit/` folder, parameterize the branches inline in one `it()`, done.

The rule of thumb:

- Prefer flow-based tests for anything user-visible.
- Use unit tests for pure functions and edge-case branches that flow tests genuinely can't reach.
- Don't duplicate coverage between the two styles.

## The real win

The coverage number at the end of a TWD run is one number from one runtime — not two reports that almost agree. If a line is uncovered, your tests didn't exercise it. That's the only reason left.

That's a small thing. Until you spend a day debugging a CI failure that turned out to be a path mismatch in a coverage merge.

If you want to try it, the runner is at [https://twd.dev](https://twd.dev).
