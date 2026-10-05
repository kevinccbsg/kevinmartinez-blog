---
title: 'In-Browser Testing: Vitest Browser Mode and TWD, Side by Side'
description: >-
  A hands-on comparison of Vitest Browser Mode and TWD on the same TODO app.
  Setup, the separate browser, rendering a real app, network mocking, coverage
  and CI. Where each one fits, and the cleanest read on which to reach for.
date: '2026-06-14'
tags:
  - testing
  - twd
  - vitest
  - frontend
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fvghu6u011blxy4lvlz1z.png
devto_url: >-
  https://dev.to/kevinccbsg/in-browser-testing-vitest-browser-mode-and-twd-side-by-side-1i3j
---
Testing components in a simulated DOM (jsdom, happy-dom) has always felt like a compromise. What we actually want is tests that run in a real browser. So when Vitest Browser Mode shipped, I was genuinely excited to try it.

I co-maintain [TWD (Testing While Developing)](https://twd.dev/), an open-source tool built around in-browser testing, so I'm not a neutral party here. But the point isn't to declare a winner. It's to notice what each tool feels like to live with, where each one is clearly strong, and which scope each is really built for. I pointed both at the same TODO app for a working session: user flows, routing, network mocking. Here's the honest read.

## 1. Setup

The first difference shows up before you write a line of code.

[Vitest](https://vitest.dev/guide/browser/) Browser Mode asks you to make a few choices up front: your framework, and a browser provider (Playwright or WebdriverIO) that becomes a dependency in your repo. It makes sense for what it is, a runner that has to drive a real browser engine, but it's a layer you set up and keep around.

TWD's in-browser side is one package plus a single command to drop the service worker into your public directory:

```bash
npm install --save-dev twd-js
npx twd-js init public --save
```

That's the whole setup to start writing tests. Different shapes for different goals: Vitest sets up its own browser-driving layer, while TWD installs into the dev environment you already have.

## 2. The standalone runner

Boot up Vitest Browser Mode and you get a dedicated standalone server with a dashboard: a sidebar, runner reports, code views, even mobile responsive toggles.

It's also young, and a couple of rough edges show that:

- **Accessibility.** Some contrast issues, and the test navigation tree doesn't have interactive controls yet to collapse or expand sections. The kind of thing that tends to get polished as a tool matures.

![Vitest browser no interactive elements](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7m4hkf0pwzv5s1zm5r4e.png)

- **No clear live execution trace.** You don't get a command-by-command log in the sidebar while a test runs, which is something I lean on in TWD.

![TWD live execution trace](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ggf87mop699niko4bk7g.png)


It ships with an example, and the example is a standalone component. That fits the intent: the tool leans toward component testing, and it's good at it.

## 3. Component testing vs full app flows

This is where the scopes split, and I think it's the most useful thing to understand about the two tools. The Vitest Browser docs lean toward component testing, and that's the lane it's built for. When I went the other way and tried to render the full app to test a flow with routing, I had to bring more setup along:

- **Path aliases.** If your app uses `@/components/*`, you replicate that bundler config so Vitest understands it.
- **Global styles.** With Tailwind it's straightforward (`setupFiles: ['./src/index.css']`). With other CSS tooling it's more config to work out.

Here's the test I wrote for a counter button wrapped in a React Router provider:

```js
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { RouterProvider } from 'react-router'
import router from '../src/AppRoutes'
import { userEvent } from 'vitest/browser'

test('renders name and increments count', async () => {
  const { getByText } = await render(
    <RouterProvider router={router} />
  )
  const title = getByText('Welcome to TWD')
  expect(title).toBeInTheDocument()

  const counterButton = getByText('Count is 0')
  expect(counterButton).toBeInTheDocument()

  await userEvent.click(counterButton)
})
```

Even for something this basic I sometimes had to restart the run to get the state to sync. None of this is a flaw so much as a sign of which job the tool is shaped around: these are small things on a TODO app, but they add up on a full app.

That's the core difference in approach. There's no separate "rendering" phase inside a sandbox wrapper with TWD. It injects into your already-running app and adapts to your project, rather than the project adapting to it.

## 4. Network mocking

This is the part that matters most to me, because in TWD we treat network interception as a pillar of frontend testing rather than an afterthought: you mock a request and own its response from the test.

Vitest Browser Mode leaves network mocking to you, by design. You have three routes:

| Option | Level | Trade-off |
|---|---|---|
| [MSW](https://www.npmjs.com/package/msw) | Real network (service worker) | Most realistic. The request actually fires and you assert on bodies. Vitest officially recommends it for browser-mode mocking. More setup: worker file in `public/`, handlers. |
| `vi.mock('@/api/todos')` | Module | Simplest. Replace the API functions with fakes. But you bypass the HTTP client and the URL, so you're testing component plus router, not the contract. |

MSW is the one I'd reach for, and the nice surprise is that it supports the test-owns-the-response pattern TWD's `mockRequest` gives you. `worker.use()` prepends a one-off handler that takes precedence, and an `afterEach(() => worker.resetHandlers())` wipes it after each test, so nothing leaks:

```js
import { http, HttpResponse } from 'msw'

test('shows empty state', async () => {
  worker.use(
    http.get('http://localhost:3001/api/todos', () => HttpResponse.json([]))
  )
  // render, assert "No todos yet"
})
```

You can keep zero defaults and have every test declare its own handler (closest to the TWD style), or keep in-memory defaults and override per test for edge cases. You can also capture `await request.json()` inside the handler and assert on it, mirroring a payload check.

So both styles are available. The difference is mostly where the work lives: MSW means standing up handlers as your own little backend, where in TWD that interception is built in. [Contract testing](https://twd.dev/contract-testing-setup) sits in the same place: it's part of TWD out of the box, and in Vitest it's something you'd add on top.

## 5. CI and coverage

Both run well in CI. It depends mostly on the browser install step on your runner, and once that's set up execution is fast either way. twd-cli handles the headless side for TWD and isn't hard to wire up.

Coverage is the one spot where the defaults differ. Vitest reports it out of the box, while in TWD you add the Istanbul plugin. That's a little setup rather than a real obstacle, but the out-of-the-box default is a nice touch on Vitest's side.

## Conclusion

Both tools earned their place by the end of the session. Just not in the same place.

Vitest Browser Mode is backed by a strong team and a large community, the terminal execution was genuinely good, and coverage comes for free. For component testing, a design system or a UI kit, try it: it's a real step up from testing components in a simulated DOM.

For a full production app driven by user flows, TWD is the one I reach for. The flow tests were possible in Vitest too, just with more setup along the way, and I'd rather stay in the tab I'm already developing in than switch to a separate browser window.

For TWD: **testing isn't a separate phase you run after coding**, it's part of development. That's the bias, stated plainly. If you're doing component work, Vitest Browser Mode is worth your time. If you're testing whole flows while you build, that's the lane TWD was made for.

The TWD is at [twd.dev](https://twd.dev). The repo is at [BRIKEV/twd](https://github.com/BRIKEV/twd).
