---
title: From Local Tests to CI in One Command
description: >-
  The /twd:ci-setup skill detects your project config and generates a GitHub
  Actions workflow with the twd-cli action, so your TWD tests run on every push.
date: '2026-04-19'
tags:
  - testing
  - twd
  - ai
  - webdev
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fcb00ijrvpy111rx6wnec.png
devto_url: 'https://dev.to/kevinccbsg/from-local-tests-to-ci-in-one-command-p9e'
---
## Why Set Up CI Early

Once you have tests worth running, the natural next step is making sure they run on every push. The sooner you do it, the fewer surprises down the road — things like env vars that only exist locally or paths that work on your machine but nowhere else.

If you've been following this series, you just ran `/twd` to write your first batch of tests. This is the right moment to wire them into CI, while everything is fresh.

## What the Skill Actually Does

`/twd:ci-setup` is part of the [TWD AI plugin](https://github.com/BRIKEV/twd-ai). Like `/twd:setup`, it starts with a **discovery phase** — detecting your project configuration before asking you anything.

The skill inspects your project to figure out:

- Your framework and build tooling
- The dev server port your app runs on
- Your base path, if you have one configured
- Whether you have coverage already wired up, and if not, whether you want it

Most of this is inferred automatically. The main thing it asks you about is coverage. Once it has the full picture, it generates a GitHub Actions workflow tailored to your project.

Here is an example of what it produces:

```yaml
name: TWD Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  pull-requests: write  # only needed if using contract-report

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install mock service worker
        run: npx twd-js init public --save

      - name: Start dev server
        run: |
          nohup npm run dev > /dev/null 2>&1 &
          npx wait-on http://localhost:5173

      - name: Run TWD tests
        uses: BRIKEV/twd-cli/.github/actions/run@main
        with:
          contract-report: 'true'
```

The workflow starts the dev server, waits for it to be ready, and runs your TWD tests using the official `twd-cli` GitHub Action. That action handles Puppeteer setup, Chrome installation, and optionally posts a contract validation report as a PR comment. If your app runs on a different port or base path, the skill adjusts the configuration accordingly.

## Running It

After you've written tests with `/twd`, run:

```plaintext
/twd:ci-setup
```

The skill will work through the detection phase, ask whether you want coverage reporting, then drop the workflow file into `.github/workflows/`. Push the branch, open a pull request, and your tests run.

That first CI run tends to surface the usual suspects: an env var that exists locally but not in CI, a path assumption that only works on your machine, or a dependency that wasn't properly declared. The skill takes care of the pipeline setup — and CI itself takes care of showing you what was missing.

## The Pattern This Follows

If you used `/twd:setup` to initialize TWD in your project, this feels familiar. Detection first, minimal questions, concrete output. The philosophy is the same: don't make developers manage configuration when the tooling can figure it out.

The two commands are designed to be used in sequence:

1. `/twd` — write tests for your components and pages
2. `/twd:ci-setup` — make sure those tests run automatically on every push

Neither requires you to know the internals of TWD, GitHub Actions syntax, or coverage tooling. You describe what you want; the skill handles the rest.

## What Comes Next

Setting up CI is about making sure your tests run. The next question is a harder one: are you testing the right things? You might have solid coverage on the happy path and nothing on the edge cases that actually break in production.

The next article in this series covers the TWD Test Gap Analysis skill — how it analyzes your existing tests, identifies what is missing, and suggests what to write next. Not just "you have low coverage on this file", but a concrete read of what user flows and failure modes are not being tested.

If you want to follow along or explore the TWD plugin: [https://github.com/BRIKEV/twd-ai](https://github.com/BRIKEV/twd-ai)
