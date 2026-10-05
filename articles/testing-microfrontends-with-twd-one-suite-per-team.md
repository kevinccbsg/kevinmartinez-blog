---
title: 'Testing microfrontends with TWD, one suite per team'
description: >-
  Microfrontends split a frontend into apps that build and deploy on their own,
  often on different frameworks and different versions. TWD gives every team the
  same in-browser runner without forcing a shared setup, and the same suites run
  headless in CI.
date: '2026-07-27'
tags:
  - testing
  - twd
  - microfrontends
  - frontend
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fbgrlfw8dtdxapigrfjx1.png
devto_url: >-
  https://dev.to/kevinccbsg/testing-microfrontends-with-twd-one-suite-per-team-18kg
---
Microfrontends split a frontend into apps that build, deploy and version on their own. One team ships React 19, another is still on React 17 and migrating away from it, a third runs Vue. That independence is the point, and it is usually why the architecture got chosen.

It also means there is no single test setup anymore.

## What usually happens to testing

Each team picks its own stack, and the same product ends up with three runners, three sets of conventions, and three different definitions of a passing build. Or testing gets pushed into one shared end-to-end suite that lives outside every team's repo and belongs to nobody. When that suite goes red, the argument about whose change broke it takes longer than the fix.

Neither outcome is anyone's plan. Both are what you get when the architecture splits and the testing story does not follow it.

## Testing is harder to skip now

A lot of frontend code is generated rather than typed. Reading all of it line by line does not scale, and the useful question is not whether it looks right, it is whether the app still does what it claims. That answer has to come from the real thing, and it has to be cheap enough that every team gets it on every change.

Splitting a frontend is a reasonable way to move faster. Splitting it and losing the check that the pieces still work is not.

## The same runner, whatever the framework

[TWD](https://twd.dev) runs tests inside the real browser, in a sidebar next to the app. It does not care which framework rendered the page, so the React team, the legacy React team and the Vue team all install the same thing.

Setup stays small. On [Vite](https://vite.dev) it is a plugin. On other bundlers it is a few lines in the dev entry point, plus one command to drop in the mock service worker. Nothing ships to production.

![Three microfrontends running side by side, each with its own TWD sidebar and its own passing suite: React 19, React 17 and Vue 3](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/wuihsl81zuz3dc15qjfq.png)

Each app keeps its own installation, its own tests and its own mocked endpoints. No shared fixture file, no shared test repo, nothing to coordinate before a team can ship. If you work with external vendors, "ship a green TWD suite" is an acceptance criterion they can satisfy in their own pipeline.

## Tests that outlive the framework

The suites read like [Testing Library](https://testing-library.com): `findByRole`, `findByText`, a click. Anyone who has written a React Testing Library test knows the shape already.

Because the assertions run against the DOM and the accessibility tree, the same test works against a React class component, a React hooks component and a Vue component. That matters most for the team on the old version. The usual reason a legacy microfrontend exists is that someone is migrating away from it one route at a time, and tests written this way do not get rewritten when that migration lands. The suite is the part that survives.

## Living documentation, in the tab you already have open

The sidebar sits next to the running app. The tests are executable examples of what each page does, in the same place you develop, so a new team member reads behaviour by running it instead of guessing from the code.

## The same suites in CI

[twd-cli](https://www.npmjs.com/package/twd-cli) runs the same tests headless. Each team points it at its own dev server and runs its own suite in its own pipeline:

```bash
npx twd-cli run
```

Nobody blocks anybody. Nothing gets rewritten into a second framework for the pipeline. What you watched pass in the sidebar is what runs on the pull request.

## One thing to know

Today TWD is set up per microfrontend, and each one is tested on its own. Testing the fully composed page, with every microfrontend mounted together, is not something it does yet. In practice the split suits the architecture: teams own their own apps, and their tests follow the same boundary.

## Try it

Microfrontends give every team its own framework, its own release and its own repo. They should not cost you the tests.

- TWD: [twd.dev](https://twd.dev)
- Example repo (three microfrontends, three frameworks, a TWD suite each): [github.com/BRIKEV/twd-module-federation](https://github.com/BRIKEV/twd-module-federation)
- Getting started: [twd.dev/getting-started](https://twd.dev/getting-started)
- Frameworks and bundlers: [twd.dev/frameworks](https://twd.dev/frameworks)
- Writing tests: [twd.dev/writing-tests](https://twd.dev/writing-tests)
- API mocking: [twd.dev/api-mocking](https://twd.dev/api-mocking)
- CI execution: [twd.dev/ci-execution](https://twd.dev/ci-execution)
