---
title: Real-browser testing for Open Cells apps with TWD
description: >-
  Open Cells is a Web Components framework from BBVA. TWD tests apps built with
  it, and any client-rendered frontend, in the real browser with real DOM, real
  components, and real browser APIs, mocking only the network. Coverage
  included.
date: '2026-07-27'
tags:
  - testing
  - twd
  - webcomponents
  - frontend
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fg3fokh65ukh32neyvmqv.png
devto_url: >-
  https://dev.to/kevinccbsg/real-browser-testing-for-open-cells-apps-with-twd-5ema
---
[Open Cells](https://www.opencells.dev) is an open-source framework from BBVA for building web apps out of Web Components. It leans on [Lit](https://lit.dev), real Shadow DOM, a hash-based router, and channels for state. If you build with Cells, you are working with real custom elements the whole way down. That is what makes Cells apps feel solid. It is also what makes them interesting to test.

## The usual Vite stack, and the gap

A Vite app usually reaches for two tools: [Vitest](https://vitest.dev) for component tests and [Playwright](https://playwright.dev) for end-to-end. Both are solid. For a Web Components app, each leaves a gap.

Vitest runs in Node against a simulated DOM. For custom elements that means rebuilding the parts that matter most: Shadow DOM, element upgrades, the router, browser storage. You spend your effort standing in for the browser instead of using it, and you test an approximation of your app.

Playwright drives a real browser, but a separate one, outside the tab you develop in. It shines for full end-to-end flows and is heavier for the everyday component check.

[TWD](https://twd.dev) offers a third place to test: the real browser, in a sidebar next to your app. Your Cells app renders exactly as it always does, and the tests run against it right there. Real DOM, real components with their Shadow DOM intact, real browser APIs. The only thing you replace is the network.

## Not just Cells

TWD is framework-agnostic. It works with any client-rendered frontend: React, Vue, Angular, Solid, Lit and Open Cells, even HTMX or plain vanilla JavaScript. If your app renders in the browser, TWD tests it in the browser. Cells is simply where the real-browser approach pays off most, because Cells is Web Components all the way down.

## Setup is small

Cells apps run on [Vite](https://vite.dev), and TWD installs as a Vite plugin. Add it to the config and the TWD sidebar appears next to your app, discovering your tests. Nothing to wire into your entry file, nothing shipped to production.

The tests read like [Testing Library](https://testing-library.com): `findByRole`, `findByText`, a click. Anyone who has written a React Testing Library test already knows the shape.

Because the tests run in a real browser, browser APIs are real. localStorage, sessionStorage, cookies: no mocks, no shims. A feature that reads a saved preference or a stored session is tested against the browser actually doing it. When you need to cut the app off from the outside world, you mock the network, so a page that calls a backend runs against fixed responses and stays deterministic and offline.

![The TWD sidebar running the Cells app's page tests in the browser](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/gqn3n1ctx7nqmvthxvzc.png)

## Coverage, without changing the build

TWD also produces coverage. A coverage-only dev server instruments the app, the headless runner collects it, and you get a standard report. No change to how the app is built beyond that coverage serve. The same tests run in CI with one command, so what you write in the dev tab is what runs on every pull request.

![nyc coverage report generated from the in-browser tests](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/wab24dxo7bff1t6uvh4h.png)

## Try it

For a framework built on Web Components, the real browser is the natural place to test. Cells gives you real custom elements. TWD lets you test them as they actually run.

- TWD: [twd.dev](https://twd.dev)
- Example repo (a Cells app tested with TWD): [github.com/BRIKEV/twd-cells](https://github.com/BRIKEV/twd-cells)
- Writing tests: [twd.dev/writing-tests](https://twd.dev/writing-tests)
- API mocking: [twd.dev/api-mocking](https://twd.dev/api-mocking)
- CI execution: [twd.dev/ci-execution](https://twd.dev/ci-execution)
- Coverage: [twd.dev/coverage](https://twd.dev/coverage)
