---
title: TWD setup is now two Vite plugins and zero app code
description: >-
  twd-js@1.8 and twd-relay@1.2 both ship Vite plugins. The sidebar, test
  discovery, service worker, and relay browser client all move into
  vite.config.ts. main.tsx no longer needs a single line of TWD wiring.
date: '2026-05-08'
tags:
  - testing
  - twd
  - vite
  - dx
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F8ohum1lmfpn5c7g680ua.png
devto_url: >-
  https://dev.to/kevinccbsg/twd-setup-is-now-two-vite-plugins-and-zero-app-code-3e4i
---
Setting up [TWD](https://www.npmjs.com/package/twd-js) used to mean adding a block of dev-only code to your app's entry file — a dynamic import for the runner, a test glob, a service-worker config, and a [twd-relay](https://www.npmjs.com/package/twd-relay) browser client. It worked, but it never really belonged there.

With `twd-js@1.8` and `twd-relay@1.2`, both packages ship Vite plugins. Setup is two entries in `vite.config.ts` and **nothing in `main.tsx`**.

## The new setup

`vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { twd } from "twd-js/vite-plugin";
import { twdRemote } from "twd-relay/vite";

export default defineConfig({
    plugins: [
        react(),
        twd({
            testFilePattern: "/**/*.twd.test.ts",
            open: false,
            position: "right",
            search: true,
        }),
        twdRemote(),
    ],
});
```

`main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes/router";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <RouterProvider router={router} />,
);
```

That's the whole setup. `twd()` owns the sidebar, glob discovery, and service-worker registration. `twdRemote()` attaches the relay to the Vite dev server and auto-injects the browser client into `index.html`. Both plugins use `apply: 'serve'`, so production builds are untouched.

## What it replaces

For comparison, here's what a TWD entry file looked like a few weeks ago:

```tsx
if (import.meta.env.DEV) {
    const { initTWD } = await import("twd-js/bundled");
    const tests = import.meta.glob("./**/*.twd.test.ts");
    initTWD(tests, {
        open: false,
        position: "right",
        serviceWorker: true,
        serviceWorkerUrl: "/mock-sw.js",
        search: true,
    });

    const { createBrowserClient } = await import("twd-relay/browser");
    const client = createBrowserClient({
        url: `${window.location.origin}/__twd/ws`,
    });
    client.connect();
}
```

Two top-level `await import`s, a glob, a service-worker URL that had to stay in sync with the runner, a WebSocket URL that had to match the relay path, and config repeating defaults. All of it dev-only, all of it sitting above `ReactDOM.createRoot`.

After the upgrade, that block is gone. No `if (import.meta.env.DEV)`, no dynamic imports, no relay client. The dev-tooling story lives entirely in `vite.config.ts`.

## Why it matters

**One source of truth for the wiring.** The `serviceWorkerUrl`, the SW served by the dev server, the WebSocket path used by the relay, and the path the browser client connects to were all strings in different files that had to agree. Now the plugins own them.

**No top-level await for tooling.** The `await import("twd-js/bundled")` was loading a chunk that had nothing to do with your app, before React was allowed to mount.

**Tooling lives in tooling config.** New developers reading `main.tsx` shouldn't have to mentally `if (import.meta.env.DEV)`-out a quarter of the file to understand startup. The plugin model is what the rest of the Vite ecosystem already does — `@vitejs/plugin-react`, Tailwind, Tanstack Router devtools — and TWD now matches.

## Non-Vite projects

Webpack, Angular CLI, Rollup, esbuild, Rspack — anywhere the Vite plugins don't apply — keep the manual API. `initTWD` and `createBrowserClient` stay public exports forever. `twdRemote({ autoConnect: false })` is also there as an escape hatch for Vite projects that want to wire the browser client by hand.

## Try it

The runner is at [https://twd.dev](https://twd.dev). Upgrade to `twd-js@1.8` and `twd-relay@1.2`, drop the dev-only block from `main.tsx`, add the two plugins to `vite.config.ts`, and you're done.
