---
title: 'When Your Mocks Lie: Contract Testing with TWD'
description: >-
  How TWD validates every mock response against your OpenAPI spec on every test
  run — catching schema drift before it hits production.
date: '2026-04-19'
tags:
  - testing
  - twd
  - contracts
  - openapi
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fx60pba8g5zz3onxwphw8.png
devto_url: 'https://dev.to/kevinccbsg/when-your-mocks-lie-contract-testing-with-twd-2e58'
---
Every mock you write is a claim about what your backend returns. The moment the backend changes — a renamed field, a tightened enum, a new required property — that claim becomes a lie. Your tests still pass. Production breaks.

This is mock drift, and it's invisible. You don't find out until a user hits a 500 or an empty UI in prod. The mocks that gave you confidence were the thing misleading you.

TWD's contract testing closes this gap. Every mock response registered in a test gets validated against your OpenAPI spec during the same run that executes the test. A schema mismatch becomes a loud, specific error — in the same output as the test failures. No separate pipeline, no broker, no provider verifier. One command does both.

This article walks through what contract testing in TWD actually does, how to wire it into an existing project, and what the output looks like when it catches real drift.

## The problem contract testing solves

Consider a typical mock in a TWD test:

```typescript
await twd.mockRequest("userList", {
  method: "GET",
  url: "/v1/users",
  response: {
    count: 3,
    next: null,
    previous: null,
    results: [
      {
        id: "a1b2-...",
        name: "Acme Corp",
        balance: "10000.00",
        // ...
      }
    ],
  },
  status: 200,
});
```

This shape made the test pass three months ago. Since then:
- The backend team removed `balance` from the list endpoint (it's a wallet concept now, served elsewhere).
- A new required field `external_id` was added.
- The `discount` field format tightened from `"15"` to `"15.00"` (two decimals).

None of these changes break the test. The component receives exactly the shape the mock provides. The test is green. Everything looks fine.

Meanwhile in production, the real API returns `external_id` (which a column in the table now expects), omits `balance` (which a detail drawer is still reading), and sends `"10.00"` where the formatter assumes trailing decimals. Bugs ship.

The test was never wrong — it was testing the wrong reality. The mock had drifted from the contract.

## What TWD does about it

TWD's contract testing runs as part of `npx twd-cli run` — the headless runner you'd typically invoke in CI, not the live sidebar you use during local dev. Your inner loop stays fast; drift gets surfaced on every push.

On every call to `twd.mockRequest()`, the response payload is collected. After tests run, each response is validated against the OpenAPI schema for the endpoint that the mock targets.

The validation uses [`openapi-mock-validator`](https://www.npmjs.com/package/openapi-mock-validator) under the hood and covers what you'd expect from JSON Schema:

- Types (`string`, `number`, `integer`, `boolean`, `array`, `object`)
- String formats (`uuid`, `email`, `date-time`, `uri`, and so on)
- Numeric bounds, array constraints, enum values
- Required fields, `additionalProperties`
- Composition (`oneOf`, `anyOf`, `allOf`)

In practice this means: if your mock returns `"id": "user-123"` where the spec says `"format": "uuid"`, you hear about it. If your mock omits `external_id` where the spec marks it required, you hear about it. If your mock sets `"status": "pending"` where the spec enum only allows `["COMPLETED", "FAILED", "PENDING"]`, you hear about it.

The key design choice: **no extra test-writing effort**. You don't author contract tests separately. The mocks you already write double as contract probes. Two signals from one artifact.

## Setting it up

Three pieces: get the spec, tell TWD about it, decide how loud to be.

### 1. Get the OpenAPI spec

Point TWD at an `openapi.json` somewhere on disk. How it gets there is up to you — a `curl` against your backend's spec endpoint in CI is the common path. Download fresh on every run so you're always validating against the current contract.

### 2. Configure TWD

Create `twd.config.json` at the project root:

```json
{
  "url": "http://localhost:5173",
  "contractReportPath": ".twd/contract-report.md",
  "retryCount": 3,
  "contracts": [
    {
      "source": "./openapi.json",
      "baseUrl": "/",
      "mode": "warn",
      "strict": true
    }
  ]
}
```

Key fields:
- `source` — path to the OpenAPI JSON.
- `baseUrl` — prefix to strip when matching mock URLs against spec paths. If your mocks call `/v1/users` and the spec paths are also `/v1/...`, set `"/"`. If the spec is served under `/api` and your mocks include that prefix, set `"/api"`.
- `mode` — `"warn"` or `"error"`. Start with `"warn"`.
- `strict` — whether to reject undocumented response properties.

### 3. Decide the mode

This is the one real decision.

**`"warn"`** — mismatches appear in the output but the test run still passes. Good posture when you're introducing contract testing into an existing codebase with accumulated drift. You see what's broken without immediately red-gating the team.

**`"error"`** — mismatches fail the run. This is where you want to land. It's the only mode that prevents regressions.

A realistic migration path: start in `warn` to surface the backlog, fix mismatches module by module, then flip to `error` once you're clean. The flip is the important step — without it, nothing stops new drift from accumulating.

## The TWD ecosystem

Contract testing isn't a standalone library — it's the seam where the TWD packages meet: mocks authored with [`twd-js`](https://www.npmjs.com/package/twd-js), runs executed by [`twd-cli`](https://www.npmjs.com/package/twd-cli), validation handled by [`openapi-mock-validator`](https://www.npmjs.com/package/openapi-mock-validator), and (if you're also using the AI agent skills) the browser bridge through [`twd-relay`](https://www.npmjs.com/package/twd-relay).

![The TWD Ecosystem](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7t4s20zj0ichfovxzv42.png)

If you're starting from zero with TWD, the [AI-powered frontend testing series](/posts/guide-to-ai-powered-frontend-testing-with-twd) walks through project setup, writing tests, and wiring them into CI. Contract testing slots in once that's working.

## The payoff: what the output looks like

This is the part worth showing up for — and it exists only because you're already in the TWD stack. Your mocks run through `twd-js`. `twd-cli` already executes them. The validator just reads what's already moving through your tests. No separate contract test suite, no broker to run, no provider verifier to keep in sync.

Run your normal test command:

```bash
npx twd-cli run
```

Alongside the usual pass/fail output for each test, you'll see a per-mock contract status line:

```plaintext
✓ GET /v1/users (200) — mock "userList" — in "User list > should display the table"
✗ GET /v1/users/{user_id} (200) — mock "getUser" — in "User detail"
  → response.external_id: missing required property "external_id"
✗ GET /v1/orders (200) — mock "getOrders" — in "User detail"
  → response.next: missing required property "next"
  → response.previous: missing required property "previous"
```

And a summary:

```plaintext
Mocks validated: 253 | Errors: 93 | Warnings: 1 | Skipped: 0

Contract report written to .twd/contract-report.md
```

That second failure line — a required property missing on a test that otherwise passes — is where contract testing earns its keep. Without it, the mock keeps serving a shape the real API no longer returns, and the only person who finds out is a user.

The markdown report is useful for PRs and CI artifacts — it groups failures by endpoint and includes the test name that produced each mock, so tracing a failure back to a specific file is straightforward.

## Why this matters more than it looks

Most contract testing tools (Pact being the canonical one) are heavy: brokers, provider verifiers, consumer-driven workflows, separate CI pipelines, coordination between frontend and backend teams. The ceremony is often what kills adoption — teams try it, find it exhausting, and revert to hoping for the best.

TWD's approach gets maybe 80% of the value for 10% of the cost, because it's opportunistic rather than exhaustive. You're not testing every possible response the backend could emit — you're testing the specific responses your app actually depends on (your mocks). That's often the right target: the place where client assumptions are encoded is exactly the place worth validating.

And it's cheap to adopt. No broker, no CI changes beyond one step to download the spec, no coordination with the backend team. A consuming team can turn this on unilaterally in an afternoon and immediately benefit.

The moment the backend ships a breaking change, your next CI run reports it. Not the next deploy. Not the next bug report from a user. The next CI run.

## Wiring it into CI

One change to your workflow:

```yaml
- name: Download OpenAPI contract
  run: npm run contract:download

- name: Install service worker
  run: npx twd-js init public --save

- name: Run TWD tests
  run: npx twd-cli run

- name: Contract testing report
  run: cat .twd/contract-report.md
```

## Conclusion

Contract testing isn't the whole pitch — it's one piece of a stack designed to make each part of the testing workflow cheap instead of painful. Adopt TWD and you get:

- Tests that run in your real browser, with a live sidebar as you develop.
- A CI pipeline that's a few lines of YAML away.
- Coverage collected without a separate configuration fight.
- Mocks that double as contract probes, validated against your OpenAPI spec on every run.

The opportunity isn't just catching drift. It's that once you're in the TWD stack, everything above comes with it — and each piece is an afternoon of setup, not a quarter of migration.

More details and the full config reference live at [twd.dev/contract-testing](https://twd.dev/contract-testing.html). The project is on GitHub at [BRIKEV/twd](https://github.com/BRIKEV/twd). If you find a bug in the validator or want a new format supported, PRs welcome.
