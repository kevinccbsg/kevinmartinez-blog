---
title: Modern Frontend Frameworks Are Failing at Testing
description: >-
  A few weeks after releasing TWD, a tool designed to integrate testing directly
  into the development workflow. I started creating testing recipes for
  different…
date: '2025-12-27'
tags:
  - webdev
  - react
  - testing
  - frontend
devto_url: >-
  https://dev.to/kevinccbsg/modern-frontend-frameworks-are-failing-at-testing-4jn4
---
A few weeks after releasing [TWD](https://brikev.github.io/twd/), a tool designed to integrate testing directly into the development workflow. I started creating testing recipes for different frontend frameworks. While doing that, a few patterns became very clear.

## What works

- Frontend-focused applications (SPAs) are relatively easy to test using tools like TWD and traditional runners such as Vitest.
- You can validate real user interactions, keep tests close to the UI, and iterate quickly.

## What doesn’t

- SSR frameworks make testing unnecessarily confusing.

Frameworks like **Next.js, Astro, TanStack, Qwik, and Solid** provide little to no guidance on how to test applications in a reliable and maintainable way. Most of them simply **delegate testing to external tools** like Playwright or Cypress ([example next.js docs](https://nextjs.org/docs/app/guides/testing)), treating testing as an afterthought rather than part of the framework itself.

---

## The problem with SSR frameworks

SSR frameworks blur the line between backend and frontend. In theory, this sounds powerful. In practice, it creates serious testing problems.

Yes, you need to test both frontend and backend behavior, but SSR frameworks don’t offer a clear or opinionated way to do that. If you look at their documentation, testing is either:

- Completely missing
- Mentioned briefly
- Outsourced to E2E tools like Playwright or Cypress

This effectively means: *“Here’s how to build fast. Testing is your problem.”*

From a company perspective—especially one building a **long-lived product**—this is a big red flag. You want:

- Tests that are easy to write
- Tests that reliably fail when something is actually broken
- Tests that help reproduce bugs
- Tests that evolve with the product

Most SSR frameworks don’t provide that. They optimize for speed of development, but you start accumulating **testing debt from day one**.

---

## “But you can unit test, right?”

Technically, yes. But in practice, unit testing frontend code often becomes *testing for the sake of testing*.

What usually happens:

- You mock half of the system
- You test implementation details
- You don’t test real user interactions

Eventually, you fall back to Playwright. And now:

- Tests live outside your app
- They’re slower
- They’re harder to debug
- They don’t feel like part of your development workflow

This is extremely common in **Next.js applications**. To this day, I haven’t seen a **truly robust testing setup** for Next.js that:

- Fails only when something meaningful is broken
- Avoids implementation details
- Is easy to write and maintain

By “robust,” I mean tests that actually protect the product—not just increase coverage numbers.

---

## React Router loaders and actions: an exception

In the React ecosystem, I found **one notable exception: React Router**, specifically createRoutesStub.

This API is interesting because it allows you to:

- Mock routes with loaders and actions
- Create different scenarios per page
- Test frontend behavior realistically
- test loaders and actions separately as pure functions

This separation of concerns is something many frameworks try to replicate—but React Router gets it right.

The API design makes testing:

- Straightforward
- Explicit
- Predictable

Even better, migrating from SPA data mode to framework (SSR) mode is **incremental and low-risk**.

After researching multiple alternatives, and considering that testing is one of the most critical aspects of a product, **React Router is the only SSR-capable solution I’d personally choose today.**

---

## Using TWD with React Router

When building TWD, we noticed how powerful `createRoutesStub` was—and decided to use it in a different way.

Instead of testing routes in isolation, we:

- Added a dedicated testing route
- Executed TWD tests inside the real application
- Rendered pages using route stubs
- Controlled loaders, actions, and scenarios per test

Here’s the setup.

### Route configuration

```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("todos", "routes/todolist.tsx"),
  route("testing", "routes/testing-page.tsx"),
] satisfies RouteConfig;
```

### Testing page

```tsx
// app/routes/testing-page.tsx
let twdInitialized = false;

export async function clientLoader() {
  if (import.meta.env.DEV) {
    const testModules = import.meta.glob("../**/*.twd.test.{ts,tsx}");
    if (!twdInitialized) {
      const { initTWD } = await import('twd-js/bundled');
      initTWD(testModules, {
        serviceWorker: false,
      });
      twdInitialized = true;
    }
    return {};
  } else {
    return {};
  }
}

export default function TestPage() {
  return (
    <div data-testid="testing-page" >
      <h1 style={{ opacity: 0.5, fontFamily: 'system-ui, sans-serif' }}>TWD Test Page</h1>
      <p style={{ opacity: 0.5, fontFamily: 'system-ui, sans-serif' }}>
        This page is used as a mounting point for TWD tests.
      </p>
    </div>
  );
}
```

![twd testing page](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/7x1ryhxb18xxu79hyiac.png)

### Example test

```tsx
import { createRoot } from "react-dom/client";
import { twd, screenDomGlobal } from "twd-js";

let root: ReturnType<typeof createRoot> | undefined;

export async function setupReactRoot() {
  if (root) {
    root.unmount();
    root = undefined;
  }

  // Navigate to the empty test page
  await twd.visit('/testing');
  
  // Get the container from the test page
  const container = await screenDomGlobal.findByTestId('testing-page');
  root = createRoot(container);
  return root;
}

describe("Hello World Test", () => {
  // root instance to re render the stub
  let root: ReturnType<typeof createRoot> | undefined;

  beforeEach(async () => {
    // preparing the root instance
    root = await setupReactRoot();
  });

  it("should render home page test", async () => {
    // mocking the component
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: () => {
          const loaderData = useLoaderData();
          const params = useParams();
          const matches = useMatches() as any;
          return <Home loaderData={loaderData} params={params} matches={matches} />;
        },
        loader() {
          return { title: "Home Page test" };
        },
      },
    ]);

    // Render the Stub
    root!.render(<Stub />);
    await twd.wait(300);
    // Check for the element within our test container
    // We scope the search to the container to be safe, or just search globally since the harness is empty otherwise
    const h1 = await screenDom.findByRole('heading', { level: 1 });
    twd.should(h1, 'have.text', 'Home Page test');
  });
});
```

Once the test runs, the route is rendered inside the real application, fully interactive, with all assertions passing.

![twd test](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/375uz5i9ru0tsi8r17zi.png)

## Conclusion

At the end of the day, you have a choice:

- Keep using tools that optimize for speed but accumulate testing debt
- Or adopt an approach where testing is part of everyday development

For SSR applications, **React Router + TWD** is the first setup I’ve seen that truly supports:

- Real UI testing
- Maintainability and easier to debug
- Long-lived products
- Fast feedback

If you work on large applications with complex requirements, this approach scales far better than traditional SSR testing strategies.

An example on how to integrate [twd + react router](https://github.com/BRIKEV/twd-react-router).
