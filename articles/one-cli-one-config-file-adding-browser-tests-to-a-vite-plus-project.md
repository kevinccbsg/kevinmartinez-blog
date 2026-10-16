---
title: 'One CLI, one config file: adding browser tests to a Vite+ project'
description: >-
  Vite+ puts dev, lint, format, type checking, commit hooks and package
  management behind one CLI and one config file. Here is what it took to add
  in-browser tests without breaking that, linting and coverage included.
date: '2026-10-16'
tags:
  - vite
  - vue
  - testing
  - twd
---

A typical frontend setup has an ESLint config, a Prettier config, lint-staged and Husky for the commit hook, and the Vite config, each with its own command and a `package.json` script to glue them together.

A fresh [Vite+](https://viteplus.dev/guide/) project has one config file, `vite.config.ts`. I wanted to see if a test tool could join that file without bringing its own sprawl. This is what happened when I added [TWD](https://twd.dev).

## What Vite+ actually unifies

Vite+ is a toolchain from VoidZero that puts Vite, Vitest, [Oxlint](https://oxc.rs/docs/guide/usage/linter.html), Oxfmt, Rolldown and tsdown behind a single CLI called `vp`. It also manages Node and your package manager.

```bash
vp install   # the right package manager, picked for you
vp dev       # Vite
vp check     # format + lint + type check, in one pass
vp build     # production build
```

The command I like most is `vp check`. It runs formatting, linting and **type checking** together, the type checking through Oxlint's type-aware path on the TypeScript Go toolchain. On the demo app it checks 22 files in about a second.

Configuration follows the same idea. Lint rules, formatter options and the pre-commit hook all live in `vite.config.ts`:

```ts
export default defineConfig({
  staged: { '*': 'vp check --fix' }, // the pre-commit hook. No Husky, no lint-staged
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: { semi: false, singleQuote: true },
  plugins: lazyPlugins(() => [vue()]),
})
```

That is the bar any new tool has to clear: **does it fit in here, or does it bring a new file and a new command?**

## The dev server: one plugin

TWD runs tests inside the app you are already developing, in a sidebar next to the page. It is wired in as a Vite plugin:

```ts
plugins: lazyPlugins(() => [
  vue(),
  twd({ testFilePattern: '/**/*.twd.test.ts' }),
]),
```

That is all. The plugin finds the test files and injects the sidebar while `vp dev` is running, and does nothing in `vp build`. `main.ts` has no test code in it, and the production bundle has none either.

## Linting: an ESLint plugin, running in Oxlint

This was the part I expected to lose.

[twd-lint](https://www.npmjs.com/package/twd-lint) catches the mistakes that make a browser test fail in confusing ways: a missing `await` on `twd.visit()`, a stray `it.only`, `describe` imported from Vitest instead of the TWD runner. It ships as an ESLint plugin. Vite+ lints with Oxlint, not ESLint.

Oxlint can load ESLint plugins as JS plugins, unchanged. So the rules go into the same `lint` block as everything else, scoped to test files with an override:

```ts
lint: {
  jsPlugins: [{ name: 'twd', specifier: 'twd-lint' }],
  overrides: [
    {
      files: ['**/*.twd.test.ts'],
      rules: {
        'twd/no-focused-tests': 'error',
        'twd/runner-imports': 'error',
        'twd/no-missing-await': 'error',
        'twd/no-request-body': 'error',
      },
    },
  ],
},
```

I tested it against a deliberately broken test file. `vp lint` reported the same five errors as the standalone `twd-lint` CLI, word for word. `vp lint --fix` rewrote the Vitest import and added the missing `await`. The rules did not fire on the same code outside a test file.

Since the hook already runs `vp check --fix` on staged files, every commit lints the tests too. Nothing to wire up.

## The tests: mocking at the network layer

The demo is a Todos page with no backend. Every API call in the tests is answered by `twd.mockRequest`, which makes the states that are annoying to reach by hand easy to test:

```ts
await twd.mockRequest('getTodos', {
  method: 'GET',
  url: '/api/todos',
  response: todoList,
  status: 200,
  delay: 500,
})
await twd.visit('/todos')

const loading = await screenDom.findByText('Loading todos...')
twd.should(loading, 'be.visible')
await twd.waitForRequest('getTodos')
```

The `delay` holds the response long enough to assert the loading state. The other tests use the same idea:

- **Error and retry:** a `500` shows the error, then the test mocks a good response and clicks Retry.
- **Request body:** `waitForRequest('createTodo')` returns the parsed JSON the page sent.
- **No call at all:** `getRequestCount('createTodo')` is `0` when validation blocks an empty title.
- **Network failure:** `status: 0` simulates a dropped connection.

Eight tests, headless, in about four seconds.

## Coverage: one more plugin

Coverage is `vite-plugin-istanbul` added to the same plugin list, switched on only when `CI=true` so the normal dev server stays fast:

```ts
istanbul({
  include: 'src/*',
  exclude: ['node_modules', '**/*.twd.test.ts', '**/twd-tests/**'],
  requireEnv: !process.env.CI,
  extension: ['.ts', '.vue'],
}),
```

[twd-cli](https://www.npmjs.com/package/twd-cli) collects the coverage at the end of a headless run, and `nyc` prints the report. The Todos page came out at 100% of lines.

One thing tripped me up: `nyc report` ignores `.vue` files by default, and `--extension .vue` replaces the default list instead of adding to it. My first report had the `.vue` files and had lost every `.ts` file. Pass both:

```bash
nyc report --reporter=text --temp-dir .nyc_output --extension .ts --extension .vue
```

## CI: the same commands, in a workflow

Vite+ has a GitHub Action, `voidzero-dev/setup-vp`, that installs Node, the package manager and the dependencies in one step. After that the workflow is just the commands from the terminal:

```yaml
- uses: voidzero-dev/setup-vp@v1.21.2
  with:
    node-version: '24'
    cache: true
- run: vp check                       # lint includes the TWD rules
- run: |
    nohup vp run dev:ci > vite.log 2>&1 &
    timeout 60 bash -c 'until curl -s -o /dev/null http://localhost:5173; do sleep 1; done'
- run: vp exec twd-cli run
- run: vp run collect:coverage:text
```

Two details are specific to Vite+ on pnpm:

- **`npx` does not work here.** The project pins pnpm through `devEngines`, and npm refuses to run (`EBADDEVENGINES`). Use `vp exec`. That also rules out the twd-cli composite actions for now, because they call `npx` internally.
- **pnpm blocks install scripts by default**, including the one where puppeteer downloads Chrome. One line in `pnpm-workspace.yaml` (`allowBuilds: { puppeteer: true }`) and `vp install` fetches it, locally and in CI.

## What it adds up to

Counting what the test setup added to the project:

- a plugin in `vite.config.ts`, plus two more entries in its `lint` block
- `twd.config.json`, two lines long
- one generated service worker in `public/`
- a `test:ci` script

No new linter, no new hook manager, no new config format. TWD fits into the tools Vite+ already gives you.

The whole project is on GitHub: [BRIKEV/twd-vp-vue](https://github.com/BRIKEV/twd-vp-vue).
