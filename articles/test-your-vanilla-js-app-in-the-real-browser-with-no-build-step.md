---
title: 'Test your vanilla JS app in the real browser, with no build step'
description: >-
  Plain HTML and JavaScript apps sit in a testing gap between "nothing" and
  "adopt a whole framework". TWD runs real in-browser tests from a single CDN
  import map, and those tests survive a later migration to React.
date: '2026-07-22'
tags:
  - testing
  - javascript
  - webdev
  - frontend
devto_url: >-
  https://dev.to/kevinccbsg/test-your-vanilla-js-app-in-the-real-browser-with-no-build-step-4mmk
---
Not every app has a bundler. Plenty of real software is still a folder of HTML and JavaScript served as static files: internal tools, landing pages, small products, and anything deliberately kept simple. These apps ship and they matter, but their testing story is thin.

The usual options do not fit. Jest plus jsdom tests a fake DOM, so tests pass while the real page breaks. Playwright is a lot of stack, and its own runner, for an app whose whole appeal is that it has no stack. What is missing is something in between: real browser behavior, without a build step to earn it.

[twd-js](https://www.npmjs.com/package/twd-js) is that middle option. It runs your tests inside the real browser, in a sidebar next to your app, using Testing Library queries you already know. And because its bundled build is self-contained, you can load it from a CDN with an import map. No bundler, no `npm install`.

![TWD sidebar running tests inside a vanilla JS app](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/33ydmb3diq39yosnck3b.png)

## Setup: one import map

TWD's bundled entry ships everything it needs, and [esm.sh](https://esm.sh) resolves its internal dependency automatically. So the entire install is an [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) in your HTML:

```html
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

Then boot TWD from your entry module. With no bundler there is no `import.meta.glob`, so you list your test files by hand: a label pointing at a lazy import of each one.

```html
<script type="module">
  import { initTWD } from 'twd-js/bundled';

  if (location.hostname === 'localhost') {
    initTWD(
      {
        './tests/helloWorld.twd.js': () => import('/tests/helloWorld.twd.js'),
        './tests/todoList.twd.js': () => import('/tests/todoList.twd.js'),
      },
      { open: true, position: 'left', serviceWorker: true, serviceWorkerUrl: '/mock-sw.js' },
    );
  }
</script>
```

The `localhost` guard keeps TWD out of production. Wrap your app in a known root such as `<div id="app">` so TWD's scoped queries know where to look.

## The tests read like Testing Library

Test files import from the same bare specifiers the import map defines. If your team has ever written a Testing Library test, this is familiar:

```js
import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it } from 'twd-js/runner';

describe('Counter', () => {
  it('increments on click', async () => {
    await twd.visit('/');
    const button = await screenDom.getByText('Count is 0');
    await userEvent.click(button);
    twd.should(button, 'have.text', 'Count is 1');
  });
});
```

## Mocking works too

TWD ships a mock service worker. The library loads from the CDN, but the service worker has to be served from your own origin, because browsers only register same-origin service workers. Run `npx twd-js init public` (or download `mock-sw.js` from the CDN) once, and API mocking works exactly like a bundled setup:

```js
await twd.mockRequest('getTodos', {
  method: 'GET',
  url: '/api/todos',
  response: [{ id: '1', title: 'Learn TWD' }],
  status: 200,
});
await twd.visit('/todos');
await twd.waitForRequest('getTodos');
```

## The part that pays off later

Here is the argument for starting with TWD even on a throwaway vanilla app: the tests are not tied to vanilla JS. They are Testing Library queries and TWD commands against the rendered DOM. The day you outgrow plain HTML and move the app to React, Vue, or Solid, the test files come with you unchanged. Only the setup changes: the import map becomes a `devDependency` and a Vite plugin.

That makes TWD a low-commitment way to add real tests now, and a migration you never have to redo. A working end-to-end example, counter and todo list, API mocking, and CI, lives in [twd-vanillajs](https://github.com/BRIKEV/twd-vanillajs).
