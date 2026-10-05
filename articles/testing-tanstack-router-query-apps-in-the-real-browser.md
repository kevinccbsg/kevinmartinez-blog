---
title: Testing TanStack Router + Query apps in the real browser
description: >-
  How to test apps built with TanStack Router, Query, and Form without jsdom and
  without wrapping everything in custom providers. Two Vite plugins, ~15 lines
  of test code, and one trick for the React Query cache.
date: '2026-05-12'
tags:
  - testing
  - tanstack
  - react
  - webdev
devto_url: >-
  https://dev.to/kevinccbsg/testing-tanstack-router-query-apps-in-the-real-browser-j3j
---
The first time you try to test a TanStack app the way the React Testing Library docs suggest, the test file gets bigger than the component. You spin up a memory router, instantiate a new `QueryClient` per test, wrap everything in `QueryClientProvider` and `RouterProvider`, set up MSW handlers for every request the loader fires, and finally write three lines of actual assertion. The component renders against jsdom. Close to the real thing, but not it.

It works. It's also where a lot of people give up on testing TanStack apps and go straight to Playwright.

There's a middle ground: run the test **inside the real app**, against the real router, the real query client, the real component tree, and get the result back as plain text. That's what [TWD](https://www.npmjs.com/package/twd-js) does, and TanStack happens to be a particularly good fit, because everything TanStack provides is already wired up by the time your test runs.

This article walks through the actual setup against a [TanStack Router + Query + Form sample app](https://github.com/BRIKEV/twd-tanstack-example), the test patterns that emerge, and the one trap you'll hit if you don't know about it.

## The setup is two Vite plugins

Install:

```bash
npm install --save-dev twd-js twd-relay
npx twd-js init public --save
```

Add the plugins to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { twd } from 'twd-js/vite-plugin'
import { twdRemote } from 'twd-relay/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    twd({ testFilePattern: '/**/*.twd.test.{ts,tsx}', open: true, position: 'left' }),
    twdRemote(),
  ],
})
```

That's the whole integration. [`twd-js`](https://www.npmjs.com/package/twd-js) auto-discovers `*.twd.test.ts` files, mounts a sidebar inside your real app, and registers a service worker for network mocking. [`twd-relay`](https://www.npmjs.com/package/twd-relay) attaches a WebSocket to the Vite dev server (the AI part, more on that below). Both plugins use `apply: 'serve'`, so production builds are untouched.

Run `npm run dev`. The sidebar appears on the left. Your TanStack app is on the right.

## Writing a test

A `.twd.test.ts` file runs in the **same browser tab** as your app. It can import anything your app imports.

Here's the full counter test from the sample repo:

```ts
// src/twd-tests/helloWorld.twd.test.ts
import { twd, userEvent, screenDom } from 'twd-js'
import { describe, it, beforeEach } from 'twd-js/runner'
import { queryClient } from '#/query-client'

describe('Hello World Page', () => {
  beforeEach(() => {
    twd.clearRequestMockRules()
    queryClient.clear()
  })

  it('counts up when you click', async () => {
    await twd.visit('/')

    const button = await screenDom.findByText('Count is 0')
    await userEvent.click(button)
    twd.should(button, 'have.text', 'Count is 1')
  })
})
```

That's it. No `render(<Counter />)`, no `MemoryRouter`, no provider wrapper. The real TanStack Router handles the `visit('/')`. The real component renders. The `screenDom` API is Testing Library's same `findByText` etc., scoped to the live DOM.

For a route that fetches:

```ts
it('shows the todo list', async () => {
  await twd.mockRequest('getTodos', {
    method: 'GET',
    url: '/api/todos',
    response: [{ id: '1', title: 'Learn TWD', description: '...', date: '2024-12-20' }],
    status: 200,
  })

  await twd.visit('/todos')
  await twd.waitForRequest('getTodos')

  const title = await screenDom.findByText('Learn TWD')
  twd.should(title, 'be.visible')
})
```

The TanStack Router `loader` runs (it calls `queryClient.ensureQueryData(...)`), the mock matches, `useSuspenseQuery` reads the cached data, the component renders. You only assert on the result.

## The trap nobody warns you about: SPA navigation keeps the cache alive

Try writing two tests against `/todos` back to back and you'll hit this:

```plaintext
Rule "getTodoList" was not executed within 1000ms.
  Expected: GET /api/todos
  Executed rules: none
```

The mock is registered. The route renders. **And no network request happens.**

Here's why. `twd.visit('/todos')` is a router navigation: same browser tab, same JS runtime, same module instances. The first test populated the `['todos']` query cache. The second test's loader calls `ensureQueryData(['todos'])`, gets the cached array, and never calls `fetch`. Your mock sits there waiting for a request that will never come.

The error looks like a network bug. It's **not**.

The fix is to expose your `QueryClient` as a module-level singleton and clear it between tests:

```ts
// src/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 30 } },
})
```

Use that singleton in `main.tsx` (instead of creating one inline) and import it in your tests:

```ts
import { queryClient } from '#/query-client'

beforeEach(() => {
  twd.clearRequestMockRules()
  queryClient.clear()
})
```

This is worth knowing for any in-browser test runner against any caching library. It's not a TWD quirk; it's the price you pay for not throwing away your app between tests. The upside is that everything else just works: your real router, your real form library, your real query devtools.

## The relay: how anything can run your tests

The second Vite plugin, `twd-relay`, opens a WebSocket on the dev server. With the app running in any browser tab, anyone (you, a teammate, an AI agent) can trigger the full suite from another terminal:

```bash
npx twd-relay run
```

The tests run in the tab you already have open, against the real router, real query cache, real component tree. The result comes back as plain text: pass/fail and the failing assertion. No headless Chrome boot, no screenshots, no DOM dumps to parse.

That's the protocol the [TWD AI plugin for Claude Code](https://github.com/BRIKEV/twd-ai) uses to write and iterate on tests autonomously: the agent writes a `.twd.test.ts` file, runs `twd-relay run`, reads the output, fixes the test if it failed, and reruns. Same tab, same app, every iteration.

If you've ever watched an AI assistant generate a test that "looks right" and then spent twenty minutes fixing the imports and selectors, the difference is hard to overstate.

## Try it

- Sample repo: [BRIKEV/twd-tanstack-example](https://github.com/BRIKEV/twd-tanstack-example). TanStack Router + Query + Form, four passing TWD tests, OpenAPI contract validation in CI, the singleton trick wired up.
- Docs: [twd.dev](https://twd.dev)
- Install in your own TanStack app:

  ```bash
  npm install --save-dev twd-js twd-relay
  npx twd-js init public --save
  ```

  Add the two plugins to `vite.config.ts`, write your first `.twd.test.ts`, run `npm run dev`. The sidebar opens itself.


![twd sidebar in a tanstack todo app](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ee0vzf49nr5uifbpw3ki.png)
