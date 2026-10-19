---
title: 'The Testing Trophy, and Where TWD Fits'
description: >-
  Kent C. Dodds' Testing Trophy says most of your confidence comes from
  integration tests. On the frontend that means rendering the real app and
  mocking only the network. Here is how TWD covers that layer, and what it
  leaves to the others.
date: '2026-10-19'
tags:
  - testing
  - twd
  - javascript
  - frontend
---

Most frontend teams I talk to have plenty of tests and still find out about broken screens from users. The unit tests are green, the refactor broke every one of them anyway, and nobody is sure the checkout flow works until someone clicks through it.

That tension is exactly what the Testing Trophy is about.

![The Testing Trophy with TWD on the integration layer](/twd-testing-trophy.png)

## The trophy

[Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) drew testing as a trophy instead of a pyramid. Four layers, and the size of each one is roughly how much of your effort it deserves:

- **Static:** typos and type errors caught as you write the code. TypeScript, ESLint.
- **Unit:** one function, hook or component checked in isolation. Vitest, Jest.
- **Integration:** several units working together. The biggest part of the trophy.
- **End to End:** a robot clicking through the deployed app, real backend included. Playwright, Cypress.

The shape comes from one line, written by Guillermo Rauch and popularized by Kent:

> Write tests. Not too many. Mostly integration.

Each layer trades speed for confidence. Unit tests are cheap, but they can pass while the screen is broken. End-to-end tests give the most confidence, but they need the whole system running and are the slowest to write and run. Integration tests sit in the middle: they use the app the way a user does, and they stay fast and deterministic because the only thing faked is what you don't own.

Kent's guiding principle for them:

> The more your tests resemble the way your software is used, the more confidence they can give you.

## What integration means on the frontend

For a frontend app, an integration test renders the real thing (routes, providers, state, components) and mocks only the network. Then it does what a user would: visit a page, type, click, and check what is on the screen.

The classic way to do this is [Testing Library](https://www.npmjs.com/package/@testing-library/dom) with jsdom, in Vitest or Jest. It is a good setup and it is where most of us learned this style. It runs in a simulated DOM in your terminal, though, separate from the app you have open while you build.

## Where TWD fits

[TWD](https://www.npmjs.com/package/twd-js) is built for that middle layer, and it runs the tests in the browser you develop in:

- **Next to your app.** A sidebar in your dev server runs the tests against the real app. You watch each one drive the page.
- **Mock what you don't own.** API calls are answered by a service worker, and contract testing checks every mock against your OpenAPI spec, so the mocks don't drift from the real API.
- **Tests that read like the user.** Testing Library queries find elements by role, label and text.
- **The same tests everywhere.** [twd-cli](https://www.npmjs.com/package/twd-cli) runs them headlessly in CI, with coverage and a video per test if you want one, and your AI agent can write, run and fix them.

In practice this layer can carry a lot. On two production apps we run 872 tests on every pull request, mostly user flows, in one headless Chrome on a 2-vCPU GitHub runner, in about 5 minutes per app.

## What it doesn't replace

TWD doesn't cover the whole trophy, and it shouldn't.

Keep a few end-to-end tests with Playwright or Cypress for the critical paths, the ones that need the real backend, the payment provider or the third-party SDK. Use unit tests for logic that is easier to check on its own. Keep TypeScript and ESLint at the base (and [twd-lint](https://twd.dev/linting) for your test files). Then let integration tests carry most of the weight.

## A map, not a ritual

TWD doesn't ask you to pick a layer before you write a test. You automate the check you were already doing by hand while you build. The trophy just shows where those checks end up: mostly in the middle.

The full page, with the trophy and the tools per layer, is at [twd.dev/testing-trophy](https://twd.dev/testing-trophy). For the strategy itself, go to the source: Kent's [TestingJavaScript.com](https://www.testingjavascript.com/).
