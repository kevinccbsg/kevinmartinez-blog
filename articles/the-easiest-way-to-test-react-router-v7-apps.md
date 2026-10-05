---
title: The easiest way to test React Router v7 apps
description: >-
  The official React Router docs send you down two paths for testing, and
  neither covers route-level components. TWD uses the framework's own
  createRoutesStub, but in the real browser, so the gap closes.
date: '2026-05-16'
tags:
  - testing
  - react
  - reactrouter
  - webdev
devto_url: 'https://dev.to/kevinccbsg/the-easiest-way-to-test-react-router-v7-apps-92p'
---
You wrote a React Router v7 route. It has a `loader`, an `action`, a form, some interactivity. Now you want to test it. The [official docs](https://reactrouter.com/start/framework/testing) hand you two paths and neither one covers the case you actually have.

Path one is `createRoutesStub` plus `@testing-library/react`, running in a terminal-based test runner. It works for small reusable components that consume router hooks. The docs explicitly warn against using it for full route components with the framework-mode `Route.*` types: "not designed for (and is arguably incompatible with) direct testing of Route components". So if you want to test the actual route the user is going to load, this path stops short.

Path two is Playwright or Cypress. The docs themselves point you there for route-level tests: "we recommend you do that via an Integration/E2E test... against a running application". That works, but you've left your dev loop, you've added a separate test stack, and the feedback cycle gets long. It's QA-shaped, not developer-shaped.

There's a middle path. Use the same `createRoutesStub` the docs recommend for components, but render it inside the **real browser**, in the **real dev server**, against the **real DOM**, with the dev loop still attached. That's what [TWD](https://www.npmjs.com/package/twd-js) does. The framework's own utility, in the right environment.

![TWD sidebar running tests against a React Router page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/x6lb49bn5m362y8g0197.png)

That's the TWD sidebar on the left, the app on the right. The sidebar is running real `createRoutesStub` tests against the live page. No jsdom, no headless Chrome, no separate process.

## Setup

Install:

```bash
npm install --save-dev twd-js
npx twd-js init public --save
```

Add the Vite plugin:

```ts
// vite.config.ts
import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import { twd } from 'twd-js/vite-plugin'

export default defineConfig({
  plugins: [
    reactRouter(),
    twd({ testFilePattern: '/**/*.twd.test.{ts,tsx}' }),
  ],
})
```

There's one SSR-mode workaround you'll hit exactly once. React Router v7 framework mode does not use a Vite-served `index.html`. The framework's own middleware renders HTML from `app/root.tsx`, and Vite's `transformIndexHtml` hook never fires for that HTML. The plugin can't auto-inject its sidebar bootstrap script. The fix is one dev-only block in `app/root.tsx`:

```tsx
<head>
  <Meta />
  <Links />
  {import.meta.env.DEV && (
    <script type="module" src="/@id/virtual:twd/init" />
  )}
</head>
```

The plugin still registers the virtual module. Vite still serves it at `/@id/...`. You're just pointing your SSR'd template at it yourself. The `import.meta.env.DEV` guard keeps the tag out of production.

Run `npm run dev`. Sidebar on the left, your app on the right.

## A fallback `/testing` route

`createRoutesStub` builds a tiny in-memory router. To mount it, you need a DOM container and a React root. The cleanest way is a dedicated route that exists only as a mounting point for tests:

```tsx
// app/routes/testing-page.tsx
export default function TestPage() {
  return <div data-testid="testing-page" style={{ minHeight: '100vh' }} />
}
```

Add it to your route table at `/testing`. Then a small utility navigates to it and hands you a fresh root in `beforeEach`:

```ts
// app/twd-tests/utils.ts
import { createRoot } from 'react-dom/client'
import { twd, screenDomGlobal } from 'twd-js'

let root: ReturnType<typeof createRoot> | undefined

export async function setupReactRoot() {
  if (root) { root.unmount(); root = undefined }
  await twd.visit('/testing')
  const container = await screenDomGlobal.findByTestId('testing-page')
  root = createRoot(container)
  return root
}
```

That's the whole harness. One route, seven lines of utility. The cost is small and you reuse it across every test.

## Writing a route-level test

This is the test the official docs say not to write with `createRoutesStub`. In TWD it works, because the stub is rendering into the same real document your app lives in. Full `Route.*` types, full hooks, real DOM.

```tsx
// app/twd-tests/todoList.twd.test.tsx
import { twd, expect, userEvent, screenDom } from 'twd-js'
import { describe, it, beforeEach } from 'twd-js/runner'
import {
  createRoutesStub,
  useLoaderData,
  useParams,
  useMatches,
} from 'react-router'
import TodoListPage from '~/routes/todolist'
import todoListMock from './mocks/todoList.json'
import { setupReactRoot } from './utils'

describe('Todo List page', () => {
  let root: Awaited<ReturnType<typeof setupReactRoot>>

  beforeEach(async () => {
    root = await setupReactRoot()
  })

  it('renders todos from the loader', async () => {
    const Stub = createRoutesStub([
      {
        path: '/',
        Component: () => {
          const loaderData = useLoaderData()
          const params = useParams()
          const matches = useMatches() as any
          return (
            <TodoListPage
              loaderData={loaderData}
              params={params}
              matches={matches}
            />
          )
        },
        loader() {
          return { todos: todoListMock }
        },
      },
    ])

    root.render(<Stub />)
    await twd.wait(300)

    const firstTodoTitle = await screenDom.getByText('Learn TWD')
    twd.should(firstTodoTitle, 'be.visible')

    const firstTodoDate = await screenDom.getByText('Date: 2024-12-20')
    twd.should(firstTodoDate, 'be.visible')
  })

  it('submits the create-todo action with the right payload', async () => {
    let payload: Record<string, string> | null = null
    const Stub = createRoutesStub([
      {
        path: '/todos',
        Component: /* same wrapper */ () => null,
        loader() { return { todos: [] } },
        async action({ request }) {
          const formData = await request.formData()
          payload = Object.fromEntries(formData) as Record<string, string>
          return null
        },
      },
    ])

    root.render(<Stub initialEntries={['/todos']} />)

    const titleInput = await screenDom.getByLabelText('Title')
    await userEvent.type(titleInput, 'Test Todo')

    const submitButton = await screenDom.getByRole('button', { name: 'Create Todo' })
    await userEvent.click(submitButton)

    expect(payload).to.deep.equal({ title: 'Test Todo' /* ... */ })
  })
})
```

The pattern is exactly the one the official docs show. The wrapper component pulls `useLoaderData` / `useParams` / `useMatches` and forwards them as props. The stub provides a loader and (optionally) an action. You render, you interact, you assert. The only difference from the docs example is where it runs.

## Backend tests: any runner works

Framework mode splits the route in two: the `loader` and `action` are server-side, the component is client-side. The two halves get tested by different tools, and the backend half is the easier one.

`loader` and `action` are async functions that take a `Request` and a context. They have no DOM, no router, no rendering. Test them with whatever your project already uses: vitest, jest, node's built-in test runner, anything. Here it is in vitest as one example:

```ts
// app/routes/todolist.test.ts
import { describe, it, expect, vi } from 'vitest'
import { loader, action } from './todolist'
import * as api from '~/api/todos'

it('loader returns todos from the api layer', async () => {
  vi.spyOn(api, 'fetchTodos').mockResolvedValue([
    { id: '1', title: 'Learn TWD', description: '', date: '2024-12-20' },
  ])

  const result = await loader({
    request: new Request('http://test/todos'),
    params: {},
    context: new Map() as any,
  })

  expect(result.todos).toHaveLength(1)
})
```

Whatever runner you pick, the test boots in milliseconds and runs anywhere Node runs. It's a function call.

Two suites, one per layer. When the backend test fails, the loader broke. When the TWD test fails, the rendering broke. You stop debugging the wrong layer.

## Why this works: same utility, different environment

`createRoutesStub` is a great piece of API. The official docs scope it to non-route components for a fair reason: mounting a full route component into jsdom is genuinely brittle, because framework-mode `Route.*` types, auto-imports, and the dev loop weren't built for a synthetic DOM. You can spend more time wrestling the harness than writing the test.

TWD changes one thing about that picture. The test runs inside your real Vite dev server, in the real browser tab where your app already runs. Auto-imports resolve. Types match runtime. The dev loop is still there. With the surrounding environment in place, the same `createRoutesStub` scales up to route-level components without fighting anything.

That change pulls a few extras along with it. The sidebar is part of your dev loop, not a separate thing you switch into. The same tab where you're building the page runs the tests. The DOM you're testing is the DOM you're using. Click around manually, run a test, watch the assertion render in real time, fix it, re-run. No context switch, no second window, no headless screenshot to interpret.

## Try it

- Sample repo: [BRIKEV/twd-react-router](https://github.com/BRIKEV/twd-react-router). React Router v7 in framework mode, a todo list with loader and action, the harness route wired up, GitHub Actions CI configured against a json-server backend (the part most sample repos forget).
- Docs: [twd.dev](https://twd.dev)

```bash
npm install --save-dev twd-js
npx twd-js init public --save
```

Add the plugin to `vite.config.ts`, drop the `<script>` tag into `app/root.tsx`, add the `/testing` route, write your first `.twd.test.tsx`. The sidebar opens itself.
