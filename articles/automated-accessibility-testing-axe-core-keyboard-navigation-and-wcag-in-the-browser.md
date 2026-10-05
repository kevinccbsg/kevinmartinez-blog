---
title: >-
  Automated Accessibility Testing: axe-core, Keyboard Navigation, and WCAG in
  the Browser
description: >-
  How to write automated accessibility tests that catch WCAG violations in
  dynamic states, using axe-core for rule checks and keyboard navigation tests
  for focus order, all running in a real browser.
date: '2026-06-22'
tags:
  - a11y
  - testing
  - webdev
  - twd
devto_url: >-
  https://dev.to/kevinccbsg/automated-accessibility-testing-axe-core-keyboard-navigation-and-wcag-in-the-browser-2eib
---
Automated accessibility testing usually means one thing: point a scanner at the page, let it check the initial HTML against a set of WCAG rules, and turn green. Missing alt text, an unlabeled input, low-contrast text at load. Caught. Done.

Then a user opens the menu, submits the empty form, expands the accordion, and lands in a state your scanner never saw. The newly revealed panel steals focus and never gives it back. The modal traps a keyboard user with no way out. None of that exists in the first render, so none of it was tested.

That is the gap this post is about. Accessibility is not a property of a page, it is a property of every state a page can reach, and most of those states only exist after someone interacts. The fix is to run your accessibility checks in a real browser, after the interaction, with two complementary tools: [axe-core](https://www.npmjs.com/package/axe-core) for WCAG rule checks, and keyboard navigation tests for focus order. This walks through both.

## The gap: accessibility tests that run in jsdom

The default setup runs your tests in jsdom. Render a component with Testing Library, run axe-core over it with [jest-axe](https://www.npmjs.com/package/jest-axe) or [vitest-axe](https://www.npmjs.com/package/vitest-axe), assert no violations. It is fast, and it is fine for catching the obvious stuff: a button with no accessible name, an input with no label, a misused ARIA attribute.

It also has a hard ceiling. jsdom does no layout and no rendering, so any check that depends on what actually paints on screen cannot run there. axe-core's `color-contrast` rule is the clearest example: in jsdom it comes back as "incomplete," not pass or fail, because there is nothing to measure. And that is before you get to anything interactive.

What it cannot tell you:

- Whether focus moves somewhere sensible after a dialog opens, and comes back when it closes.
- Whether the validation summary that renders after a failed submit is actually announced and reachable.
- Whether your tab order matches the visual order once a section expands.
- Whether a custom component announces its name, role, and state to a screen reader after it changes.

These are not edge cases. They are where most real accessibility complaints come from. And they all depend on layout, focus, and event behavior that jsdom only approximates. To test them you need the real thing: a real browser, real focus, real events.

That is the part TWD is built for. Tests run inside the actual browser, against your real app, and you drive them the way a user would. Which means you can scan accessibility *after* the interaction, not just before it.

## Approach 1: axe-core, scanned after the interaction

[axe-core](https://www.npmjs.com/package/axe-core) is the engine behind most accessibility tooling. It is excellent at the rule-based checks: contrast, names, roles, ARIA misuse. The trick is not running axe. The trick is running it against the state that matters.

A small helper turns axe results into a readable failure instead of a wall of JSON:

```ts
import axe from "axe-core";

type AxeResults = import("axe-core").AxeResults;
type RunOptions = import("axe-core").RunOptions;
type ElementContext = import("axe-core").ElementContext;

/**
 * Run axe-core against the page (or a scoped element) and throw a
 * formatted error if there are any accessibility violations.
 */
export async function checkA11y(
  context?: ElementContext,
  options?: RunOptions
): Promise<AxeResults> {
  const results = await axe.run(context ?? document, options);

  if (results.violations.length) {
    const report = results.violations
      .map((v, i) => `${i + 1}. [${v.impact ?? "n/a"}] ${v.id}: ${v.help}\n   ${v.helpUrl}`)
      .join("\n\n");
    throw new Error(
      `Found ${results.violations.length} accessibility violation(s):\n\n${report}`
    );
  }

  return results;
}
```

A baseline scan of the page that loads is the easy case:

```ts
import { twd, userEvent, screenDom } from "twd-js";
import { describe, it, beforeEach } from "twd-js/runner";
import { checkA11y } from "./helpers/axe";

// Only WCAG 2.0/2.1 A & AA rules. Skips axe "best-practice" rules
// (region, landmark-one-main, ...) which are recommendations, not failures.
const WCAG = {
  runOnly: {
    type: "tag" as const,
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
};

describe("Accessibility", () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
  });

  it("should have no WCAG 2 A/AA violations on the home page", async () => {
    await twd.visit("/");
    await checkA11y(document, WCAG);
  });
});
```

That is the part every tool can do. Here is the part that needs a real browser and a real interaction: scanning a state that only exists *after* the user does something.

```ts
it("should stay accessible after form validation errors render", async () => {
  await twd.mockRequest("getTodoList", {
    method: "GET",
    url: "/api/todos",
    response: [],
    status: 200,
  });
  await twd.visit("/todos");
  await twd.waitForRequest("getTodoList");

  // Submit the empty form to force the validation error messages to render.
  const submitButton = await screenDom.findByRole("button", { name: "Create Todo" });
  await userEvent.click(submitButton);

  // Confirm the new dynamic content actually appeared before scanning.
  const error = await screenDom.findByText("Title is required");
  twd.should(error, "be.visible");

  // Scope the scan to just the form so the report is about this component.
  const form = await screenDom.findByTestId("todo-form");
  await checkA11y(form, WCAG);
});
```

The error messages in that test do not exist in the initial HTML. They render after a failed submit. A static scan never reaches them, so it never checks whether they are associated with their fields, announced, or reachable. Driving the interaction first, then scoping the scan to the form, checks the state a user actually lands in.

Scoping matters too. Passing the form element instead of `document` keeps the report about the component you just exercised, rather than re-flagging everything else on the page.

## Approach 2: keyboard navigation and focus order

axe will not tell you whether your tab order makes sense. It cannot. Whether <kbd>Tab</kbd> moves through controls in an order that matches the visual flow, whether focus is visible, whether a control is even reachable by keyboard: that is behavior, and you have to drive it.

Because TWD tests run in the real browser, `userEvent` drives real focus. So you can walk the page the way a keyboard user does and assert where focus lands at each step.

```ts
it("keyboard navigation should work", async () => {
  await twd.visit("/chat");

  const user = userEvent.setup();

  // Tab from the top of the page. First stop should be the back link.
  await user.tab();
  const backToLanding = screenDom.getByRole("link", { name: "← Back to Landing" });
  twd.should(backToLanding, "be.focused");

  // Tab again. Focus should land on the prompt input, and typing should work.
  await user.tab();
  await user.keyboard("write some text");
  const textarea = screenDom.getByLabelText("Main prompt input (required)");
  twd.should(textarea, "have.text", "write some text");
});
```

This is a deterministic check of two things a scanner cannot see: the focus order is correct (back link, then input), and the input is reachable and usable by keyboard alone. If someone later drops a non-focusable `div` with a click handler into the flow, or reorders the DOM so tab order no longer matches the layout, this test fails. You find out in the run, not from a user report.

You can extend the same pattern to the cases that bite hardest: open a dialog and assert focus moved into it, close it and assert focus returned to the trigger, tab to the end of a menu and assert it does not escape into the page behind it.

## Watch out with automated accessibility testing

Automated accessibility testing has a ceiling. Rule-based tools catch roughly a third of WCAG issues. axe is very good inside that third, and driving the interaction first stretches it to states a load-time scan cannot reach, but it is still a third. The rest needs a human: real screen reader testing, and judgment about whether labels, content order, and motion actually make sense.

So treat this as the regression net, not the whole strategy. It is the part you can run on every change, in CI, that stops obvious and post-interaction failures from sliding back in between manual audits.

## Why this matters to us

We build the tool this runs on, [twd-js](https://www.npmjs.com/package/twd-js), and we treat its own accessibility as a first-class requirement, not a nice-to-have. A tool whose entire job is to help people ship correct software has no business locking anyone out of using it. So the sidebar UI is fully keyboard navigable with a logical focus order and no traps, the focus indicator is visible in both light and dark themes, and text and controls meet WCAG contrast ratios. We had it audited by an external accessibility consultancy against WCAG 2.2 Level AA, and it came back at full conformance. You can read the [accessibility statement](https://twd.dev/accessibility-statement) for the full scope and methodology.

## Try it

Both approaches are just tests, running in your real app, in a real browser:

```bash
npm install twd-js
```

- Docs: [twd.dev](https://twd.dev/)
- The axe-core helper and the validation-state example live in the [tutorial repo](https://github.com/BRIKEV/twd)
- Source and issues: [github.com/BRIKEV/twd](https://github.com/BRIKEV/twd)

Point a scan at the page that loads if you want a baseline. Then write the one that clicks the button first. That second test is the one your users were waiting for.
