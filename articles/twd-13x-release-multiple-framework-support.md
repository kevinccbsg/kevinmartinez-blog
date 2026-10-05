---
title: TWD 1.3.x release - Multiple framework support
description: >-
  One of the biggest milestones we’ve been working on is now live: TWD 1.3.x
  brings full multi-framework support with a single unified setup.
date: '2025-12-08'
tags:
  - tutorial
  - react
  - twd
  - testing
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F98weybiclmfbm3ougubs.png
devto_url: 'https://dev.to/kevinccbsg/twd-13x-release-multiple-framework-support-154'
---
One of the biggest milestones we’ve been working on is now live:
**TWD 1.3.x brings full multi-framework support with a single unified setup.**

This means you can now drop TWD into React, Vue, Solid, and Angular projects using the **exact same initialization code**, thanks to the new bundled build.

At its simplest, all you need is this:

```ts
// src/main.tsx (or .ts)
if (import.meta.env.DEV) {
  const { initTWD } = await import('twd-js/bundled');
  const tests = import.meta.glob("./**/*.twd.test.ts");
  
  initTWD(tests, { open: true, position: 'left' });
}
```

## React

React continues to have the most flexible integration: use the standard setup for advanced customization or the bundled one for simplicity.

### Standard Setup (full control)

```ts
if (import.meta.env.DEV) {
  const testModules = import.meta.glob("./**/*.twd.test.ts");
  const { initTests, twd, TWDSidebar } = await import('twd-js');
  
  initTests(testModules, <TWDSidebar open={true} position="left" />, createRoot);
  twd.initRequestMocking().catch(console.error);
}
```

### Simplified Setup (bundled)

```ts
if (import.meta.env.DEV) {
  const { initTWD } = await import('twd-js/bundled');
  const tests = import.meta.glob("./**/*.twd.test.ts");
  
  initTWD(tests, { open: true, position: 'left' });
}
```

**[View React Examples](https://github.com/BRIKEV/twd/tree/main/examples)** - Multiple React examples available in the repository.

## Vue

For Vue applications, use the bundled version of TWD. This ensures that the React runtime required by TWD's UI is handled correctly without conflicting with your Vue app. Request mocking is automatically initialized.

**[Vue Example Repository](https://github.com/BRIKEV/twd-vue-example)** - Complete working example with advanced scenarios.

```ts
// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'

if (import.meta.env.DEV) {
  // Use the bundled version
  const { initTWD } = await import('twd-js/bundled');
  const tests = import.meta.glob("./**/*.twd.test.ts")
  
  // Request mocking is automatically initialized
  initTWD(tests);
}

createApp(App).mount('#app')
```

## Solid

For Solid.js applications, use the bundled version of TWD. This ensures that the React runtime required by TWD's UI is handled correctly without conflicting with your Solid app. Request mocking is automatically initialized.

**[Solid Example Repository](https://github.com/BRIKEV/twd-solid-example)** - Complete Solid.js integration example.

```tsx
// src/main.tsx
/* @refresh reload */
import { render } from 'solid-js/web';
import 'solid-devtools';

import App from './App';

if (import.meta.env.DEV) {
  const { initTWD } = await import('twd-js/bundled');
  const tests = import.meta.glob("./**/*.twd.test.ts");
  
  // Request mocking is automatically initialized
  initTWD(tests);
}

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App />, root!);
```

### Notes for Solid

- This setup works with **Solid + Vite** applications
- Solid Start compatibility has not been tested yet, but may work with similar configuration

## Angular

Angular applications can also use the bundled version. Note that you might need to manually construct the `tests` object if your build tool doesn't support glob imports in the same way. Request mocking is automatically initialized.

**[Angular Example Repository](https://github.com/BRIKEV/twd-angular-example)** - Working Angular integration example.

```ts
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { isDevMode } from '@angular/core';

if (isDevMode()) {
  const { initTWD } = await import('twd-js/bundled');
  
  // Define your test files manually or use a compatible glob importer
  const tests = {
    './twd-tests/helloWorld.twd.test.ts': () => import('./twd-tests/helloWorld.twd.test'),
    './twd-tests/todoList.twd.test.ts': () => import('./twd-tests/todoList.twd.test'),
  };
  
  // Request mocking is automatically initialized
  initTWD(tests);
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

## Summary

TWD 1.3.x introduces a universal setup that lets you write a test and run it in any framework—React, Vue, Solid, or Angular. The new bundled version provides a single, simple initialization method that works everywhere.

You get the full TWD experience in every environment:

- **Testing While Developing** with the live in-app sidebar
- **Fast, interactive test creation** directly inside your running app
- **Straightforward setup** with just one init function
- **Automatic request mocking** included by default
- **CI-ready tests** that behave the same in development and pipelines
- **Easy to write, easy to maintain**, and now fully **framework-agnostic**

With TWD 1.3.x, your tests become portable, consistent, and reusable—**write them once, run them anywhere.**
