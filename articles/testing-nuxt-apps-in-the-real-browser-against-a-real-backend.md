---
title: 'Testing Nuxt apps in the real browser, against a real backend'
description: >-
  Test your Nuxt pages in the real browser with TWD, against the real Nitro
  backend and database. No route mocks: a dev-only endpoint resets the database
  before each test.
date: '2026-06-10'
tags:
  - testing
  - nuxt
  - vue
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Ftlctsmzxkx9cpax49xig.png
devto_url: >-
  https://dev.to/kevinccbsg/testing-nuxt-apps-in-the-real-browser-against-a-real-backend-2nnk
---
You just built a Nuxt todo page. It loads from a Nitro route, adds a todo, deletes one, and it works when you click around. Now you want a test that proves it keeps working.

The usual answer is to leave the app, stand up a separate test stack, and rebuild the page in a fake environment with every route mocked. TWD takes the other path: test it where you already are, while you are still building it.

[TWD](https://www.npmjs.com/package/twd-js) runs your tests inside the Nuxt dev server, in the real browser tab where the app already runs. The same todo page gets tested end to end, against your real backend. No route mocks, no separate e2e stack, no jsdom.

Here is the full setup.

## Setup

```bash
npm install --save-dev twd-js
npx twd-js init public --save
```

Add the Vite plugin in `nuxt.config.ts`:

```ts
import { twd } from 'twd-js/vite-plugin'

export default defineNuxtConfig({
  vite: {
    plugins: [
      twd({ testFilePattern: '/**/*.twd.test.{ts,tsx}' }),
    ],
  },
})
```

Two Nuxt-specific bits to wire up, both one-time.

## 1. Inject the sidebar in app.vue

Nuxt does not serve a Vite `index.html`. Nitro renders the HTML, so the plugin cannot auto-inject its sidebar script. Point your app at the virtual module yourself, dev-only, in `app.vue`:

```vue
<script setup lang="ts">
if (import.meta.dev) {
  useHead({
    script: [{ src: '/_nuxt/@id/virtual:twd/init', type: 'module' }],
  })
}
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
```

Note the `/_nuxt/` prefix, that is Nuxt's Vite base. The `import.meta.dev` guard keeps the tag out of production.

## 2. Reload the browser when a test file changes

On Nuxt 4 with Vite 7, editing a `.twd.test` file does not reload the browser on its own. This small plugin fixes it: it watches your test files and triggers a reload when one changes.

```ts
// npm install --save-dev chokidar
import chokidar from 'chokidar'
import type { Plugin } from 'vite'

function twdTestHmr(): Plugin {
  const isTestFile = (file: string) => /\.twd\.test\.tsx?$/.test(file)
  return {
    name: 'twd-test-hmr',
    apply: 'serve',
    configureServer(server) {
      // Under Nuxt, Vite's config.root is the app/ srcDir, where the tests live.
      const watcher = chokidar.watch(server.config.root, {
        ignored: (path) => /node_modules|\.nuxt|\.output|\.git/.test(path),
        ignoreInitial: true,
      })
      const reload = (file: string) => {
        if (!isTestFile(file)) return
        // Drop the cached module so the reload serves fresh code.
        const graph = server.environments?.client?.moduleGraph ?? server.moduleGraph
        for (const mod of graph.getModulesByFile(file) ?? []) {
          graph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload', path: '*' })
      }
      watcher.on('change', reload).on('add', reload).on('unlink', reload)
      server.httpServer?.once('close', () => void watcher.close())
    },
  }
}
```

Add `twdTestHmr()` to the `plugins` array next to `twd()`. Edit a test, the browser reloads.

Run `npm run dev`. Sidebar on the left, your app on the right.

![Nuxt app with twd tests running](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/2dyn3qub25h2566oo5wv.png)

## Testing against the real backend

You do not mock routes. The tests hit your dev server and your database for real. The only thing you need is a clean starting point for each test.

A dev-only endpoint gives you that. It resets the database to a seeded baseline, guarded so it never exists in production:

```ts
// server/api/__test/reset.post.ts
export default defineEventHandler(() => {
  if (!import.meta.dev) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  resetDb()
  return { ok: true, todos: listTodos() }
})
```

`resetDb()` deletes every row, resets the id sequence so seeded ids are deterministic, and re-seeds. The `import.meta.dev` guard means the route returns 404 in a production build.

Call it before each test, then drive the real UI:

```ts
import { twd, userEvent, screenDom } from 'twd-js'
import { describe, it, beforeEach } from 'twd-js/runner'

describe('Todos (real SQLite backend)', () => {
  beforeEach(async () => {
    // Reset the database to its seeded state. No route mocking.
    await fetch('/api/__test/reset', { method: 'POST' })
  })

  it('creates a todo end to end', async () => {
    await twd.visit('/todos')
    await userEvent.type(screenDom.getByTestId('todo-input'), 'Buy milk')
    await userEvent.click(screenDom.getByTestId('todo-add'))

    twd.should(await screenDom.findByText('Buy milk'), 'be.visible')
  })
})
```

No mock rules. The `POST` persists to the database, the list refreshes, and the assertion runs against the real rendered DOM. Delete a row and assert it is gone, same shape. When a test fails, it failed against the real backend, not against a mock you forgot to update.

## Try it

- Sample repo: [BRIKEV/twd-nuxt-example](https://github.com/BRIKEV/twd-nuxt-example). Nuxt 4, a SQLite-backed todo list, the HMR plugin, the dev-only reset endpoint, and tests that run against the real backend.
- Docs: [twd.dev](https://twd.dev)

```bash
npm install --save-dev twd-js
npx twd-js init public --save
```

Add the plugin to `nuxt.config.ts`, drop the dev-only script into `app.vue`, add the HMR plugin, write your first `.twd.test.ts`. The sidebar opens itself.
