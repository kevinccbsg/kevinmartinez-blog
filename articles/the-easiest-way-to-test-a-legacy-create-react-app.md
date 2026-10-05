---
title: The easiest way to test a legacy Create React App
description: >-
  CRA is deprecated but your app still ships. You don't need a Vite migration to
  get real browser tests. TWD runs on Webpack with one block in your entry file.
date: '2026-07-14'
tags:
  - testing
  - react
  - javascript
  - webdev
devto_url: >-
  https://dev.to/kevinccbsg/the-easiest-way-to-test-a-legacy-create-react-app-bgj
---
Create React App was [officially deprecated](https://react.dev/blog/2025/02/14/sunsetting-create-react-app) in February 2025. The apps built with it didn't disappear. If you maintain one, you know the drill: the app works, it ships, and the Vite migration sits on the backlog behind everything that makes money.

The testing story is where that hurts. Your options look like Jest plus jsdom, where tests pass while the real page breaks, or bolting Playwright onto an app that's in maintenance mode. One is too far from the browser, the other is a lot of stack for an app nobody wants to invest in.

There's a third option. [twd-js](https://www.npmjs.com/package/twd-js) runs your tests inside the real browser, in the dev server you already have open, using Testing Library queries you already know. Every TWD guide assumes Vite, but the library doesn't care about your bundler. It works on CRA's Webpack with one block of code.

![TWD sidebar running tests inside a Create React App](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/xefjfwydzhybtyu1h51f.png)

That's the TWD sidebar next to a CRA app. The tests drive the actual page: real DOM, real router, real fetch calls intercepted by a service worker.

## Setup

Install the library and copy the mock service worker into `public/`:

```bash
npm install --save-dev twd-js
npx twd-js init public
```

Vite projects get a plugin that handles test discovery. On Webpack you wire it yourself with `require.context` in `src/index.js`:

```js
if (process.env.NODE_ENV === "development") {
  // Webpack's version of import.meta.glob
  const context = require.context("./", true, /\.twd\.test\.ts$/);

  const testModules = {};
  context.keys().forEach((key) => {
    testModules[key] = async () => Promise.resolve(context(key));
  });

  const { initTWD } = await import('twd-js/bundled');

  initTWD(testModules, {
    open: true,
    search: true,
    serviceWorker: true,
    serviceWorkerUrl: '/mock-sw.js',
  });
}
```

The `NODE_ENV` guard keeps all of it out of the running production app.

One detail that surprised me: the test files are TypeScript (`.twd.test.ts`) inside a plain JavaScript CRA project, and that just works. CRA's Babel pipeline strips types without the `typescript` package installed. You don't get type checking on the tests, but they compile and run.

## You already know the queries

TWD's `screenDom` wraps [@testing-library/dom](https://www.npmjs.com/package/@testing-library/dom) and its `userEvent` wraps the Testing Library user-event package. If your team writes Testing Library unit tests today, the tests read the same. The difference is where they run.

```ts
import { twd, userEvent, screenDom } from "twd-js";
import { describe, it } from "twd-js/runner";

describe("Hello World Page", () => {
  it("should display the welcome title and counter button", async () => {
    await twd.visit("/");

    const title = await screenDom.getByText("Welcome to TWD");
    twd.should(title, "be.visible");

    const counterButton = await screenDom.getByText("Count is 0");
    await userEvent.click(counterButton);
    twd.should(counterButton, "have.text", "Count is 1");
  });
});
```

Run `npm start`, open the app, and the sidebar lists your suites. Click one and watch it drive the page you're looking at.

## Mocking the API

The service worker intercepts requests before they leave the browser, so tests are deterministic without a backend running (`expect` ships with twd-js, no chai install needed):

```ts
it("should create a todo", async () => {
  await twd.mockRequest("getTodoList", {
    method: "GET",
    url: "/api/todos",
    response: [],
    status: 200,
  });
  await twd.mockRequest("createTodo", {
    method: "POST",
    url: "/api/todos",
    response: { id: "1" },
    status: 200,
  });
  await twd.visit("/todos");

  await userEvent.type(await screenDom.getByLabelText("Title"), "Test Todo");
  await userEvent.type(await screenDom.getByLabelText("Description"), "Test Description");
  await userEvent.type(await screenDom.getByLabelText("Date"), "2024-12-20");
  await userEvent.click(await screenDom.getByRole("button", { name: "Create Todo" }));

  const rule = await twd.waitForRequest("createTodo");
  expect(rule.request).to.deep.equal({
    title: "Test Todo",
    description: "Test Description",
    date: "2024-12-20",
  });
});
```

That last assertion checks the exact body your form submitted. If someone renames a field in the payload, this fails in the sidebar while you're developing, not in QA.

## Two gotchas (and the fixes)

CRA's tooling assumes every test file in `src/` is a Jest test. TWD tests are not, so there are two collisions.

**Jest picks up the TWD tests.** `react-scripts test` matches `*.twd.test.ts` and tries to run browser tests in jsdom. Exclude them in the `test` script:

```json
"test": "react-scripts test --testPathIgnorePatterns=src/twd-tests"
```

**ESLint flags the assertions.** The `react-app/jest` preset reports TWD's chai-style `expect(...).to.deep.equal(...)` as `jest/valid-expect` errors, and CRA surfaces them as compile errors in the dev server. Relax the rules for TWD test files only:

```json
"eslintConfig": {
  "extends": ["react-app", "react-app/jest"],
  "overrides": [
    {
      "files": ["src/twd-tests/**/*", "**/*.twd.test.*"],
      "settings": {
        "testing-library/utils-module": "off",
        "testing-library/custom-renders": "off",
        "testing-library/custom-queries": "off"
      },
      "rules": {
        "jest/valid-expect": "off",
        "jest/valid-expect-in-promise": "off"
      }
    }
  ]
}
```

Everything stays strict for your regular Jest tests.

## CI in one job

The same tests run headlessly with [twd-cli](https://www.npmjs.com/package/twd-cli), a Puppeteer-based runner. After the usual checkout and `npm ci`, the whole job is: start the dev server, run the CLI.

```yaml
- name: Start CRA dev server
  run: |
    nohup npm start > cra.log 2>&1 &
    npx wait-on http://localhost:3000
  env:
    CI: true
    BROWSER: none

- name: Run TWD tests
  uses: BRIKEV/twd-cli/.github/actions/run@main
```

The CLI can also validate every request mock against an OpenAPI spec, so your mocks can't silently drift from the real API. See [contract testing](https://brikev.github.io/twd/contract-testing) if that's your kind of thing.

## The whole thing is a repo

Everything above comes from a working example with green CI: [twd-create-react-app](https://github.com/BRIKEV/twd-create-react-app). The [CRA guide in the TWD docs](https://brikev.github.io/twd/frameworks#create-react-app-cra) covers the same steps.

## When you finally migrate to Vite

Here's the payoff that outlasts the maintenance work. These tests are agnostic to your bundler. They drive the real DOM in a real browser, not your webpack config, so nothing in them is tied to CRA.

When the Vite migration finally gets prioritized, you don't rewrite the suite. You run it against the new build and confirm the app behaves exactly as before. TWD runs on Vite too, so the tests carry over untouched. The setup you added to survive on CRA is the setup that tells you the migration worked.

**Your app might be legacy. Your tests don't have to be.**
