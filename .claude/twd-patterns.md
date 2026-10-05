# TWD Project Patterns

## Project Configuration

- **Framework**: React 19 + React Router 8 (framework mode, `ssr: false` + `prerender`)
- **Vite base path**: /
- **Dev server port**: 5180 (`strictPort`; must match `twd.config.json`)
- **App URL**: http://localhost:5180 (twd-cli opens `/testing`, the bare mount page)
- **Dev command**: npm run dev
- **Default branch**: main
- **Entry point**: app/root.tsx (TWD init scripts are rendered after `<Scripts />`)
- **Public folder**: public/
- **Closing run**: full suite

### Runner Commands

twd-cli drives its own headless browser — only the dev server has to be up (`npm run dev`).

```bash
# Run all tests
npm run test:ci

# Run specific tests by name (matches "suite > test", case-insensitive; repeatable)
npx twd-cli run --test "should render the list"
npx twd-cli run --test "should create" --test "should show the error"

# Only the tests this branch added or changed
npx twd-cli run --changed-since origin/main

# Record a run to video (one clip per matched test, needs ffmpeg)
npx twd-cli run --record --test "should render the list"
```

Every run writes `.twd/report/`: `run.json` (the result), `summary.md` and `index.html`. The folder is replaced on each run.

## Test Location

Tests live in `app/twd-tests/*.twd.test.tsx` (discovered by the `twd()` Vite plugin).
Shared helpers and fixture data are in `app/twd-tests/utils.tsx`.

## Standard Imports

```typescript
import { twd, userEvent, screenDom, expect } from "twd-js";
import { describe, it, beforeEach } from "twd-js/runner";
import SomeRoute from "~/routes/some-route";
import { posts, renderRoute, setupReactRoot } from "./utils";
```

## How Tests Mount Routes

Routes are prerendered static HTML with loaders that read `articles/` on the server,
so tests do not visit real pages. Instead they mount a route component into the
dev-only `/testing` page (rendered without site chrome) via `createRoutesStub`,
passing fixture `loaderData`:

```typescript
describe("Some page", () => {
  beforeEach(async () => {
    await setupReactRoot(); // twd.visit("/testing") + fresh React root
  });

  it("renders", async () => {
    renderRoute(SomeRoute, { path: "/posts/:slug", url: "/posts/foo", loaderData: { ... } });
    const heading = await screenDom.findByRole("heading", { level: 1 });
    twd.should(heading, "be.visible");
  });
});
```

Any navigation away from the stubbed route lands on a `*` route that renders
`navigated away` — assert on that text to check links.

## Request Mocking

The `twd()` plugin runs with `serviceWorker: false`: there is no runtime API, all data
comes from loaders, so pass fixture `loaderData` instead of `twd.mockRequest(...)`.
If a feature ever fetches at runtime, enable the service worker first
(`npx twd-js init public --save` and drop `serviceWorker: false`), then add
`twd.clearRequestMockRules()` to `beforeEach`.

## Portals and Dialogs

Use `screenDomGlobal` instead of `screenDom` for elements rendered in portals (modals, dropdowns, tooltips):

```typescript
import { screenDomGlobal } from "twd-js";
const modal = screenDomGlobal.getByRole("dialog");
```
