---
title: Testing HTMX apps in the real browser with TWD
description: >-
  HTMX apps return HTML, not JSON, and run no build step. TWD loads from a CDN
  and tests the hypermedia flow where it actually happens, in the browser,
  against your real backend.
date: '2026-07-22'
tags:
  - testing
  - htmx
  - javascript
  - webdev
devto_url: 'https://dev.to/kevinccbsg/testing-htmx-apps-in-the-real-browser-with-twd-3j4e'
---
HTMX apps are refreshingly simple: the server returns HTML fragments, and HTMX swaps them into the page in response to `hx-get`, `hx-post`, and friends. There is usually no bundler and no client framework. That simplicity is the point, and it is also why the usual testing tools feel wrong. A jsdom unit test cannot see an HTMX swap, and a full end-to-end runner is a lot of machinery to bolt onto an app that deliberately avoids machinery.

[twd-js](https://www.npmjs.com/package/twd-js) fits the HTMX model well. It runs tests inside the real browser, so it sees exactly what HTMX does to the DOM, and it installs from a CDN with an import map, so it adds no build step of its own.

![TWD sidebar running tests inside an HTMX app](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bk54c3v9flr200opkz9h.png)

## Setup: load both from a CDN

Load HTMX as usual, then add an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) for TWD next to it. [esm.sh](https://esm.sh) resolves TWD's internal dependency, so there is nothing else to wire up.

```html
<script src="https://unpkg.com/htmx.org@2.0.10/dist/htmx.min.js"></script>
<script type="importmap">
  {
    "imports": {
      "twd-js": "https://esm.sh/twd-js@1.8.2",
      "twd-js/runner": "https://esm.sh/twd-js@1.8.2/runner",
      "twd-js/bundled": "https://esm.sh/twd-js@1.8.2/bundled"
    }
  }
</script>
```

Your markup stays pure HTMX:

```html
<button hx-get="/api/todos" hx-target="#todo-list" hx-swap="innerHTML">Load todos</button>
<ul id="todo-list"></ul>
```

## Test against the real backend

The important design choice for HTMX is what to assert against. Because HTMX endpoints return HTML fragments rather than JSON, the cleanest approach is to run the tests against your real HTML-returning backend and reset it between tests, rather than mocking. This is the same pattern the [Nuxt example](https://github.com/BRIKEV/twd-nuxt-example) uses for real-backend testing.

A tiny dev-only reset endpoint gives every test a clean starting point:

```js
import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';

describe('Todo List (HTMX)', () => {
  beforeEach(async () => {
    await fetch('/api/reset', { method: 'POST' });
  });

  it('loads the seeded todos', async () => {
    await twd.visit('/');

    const loadButton = await screenDom.getByRole('button', { name: 'Load todos' });
    await userEvent.click(loadButton);

    // HTMX swaps asynchronously, so use findBy* (which waits) rather than getBy*.
    const todo = await screenDom.findByText('Learn TWD');
    twd.should(todo, 'be.visible');
  });
});
```

The one detail worth internalizing: HTMX swaps happen after an async request, and there is no mock to await, so query with Testing Library's `findBy*` (which retries until the element appears) instead of the synchronous `getBy*`.

## A note on mocking

TWD's service worker will happily intercept HTMX's requests, the same as any `fetch` or XHR. Today `twd.mockRequest` serializes responses as JSON, which is a natural fit for JSON APIs but not for HTML fragments, so for HTMX we recommend the real-backend approach above. First-class HTML-fragment mocking for hypermedia frameworks is on the roadmap.

## Try it

A complete example, an HTMX todo list with load, create, and delete, a small Express backend with a reset endpoint, in-browser tests, and CI, lives in [twd-htmx](https://github.com/BRIKEV/twd-htmx). It is served as static files with TWD loaded straight from the CDN, so you can read the whole thing top to bottom without a build step in sight.
