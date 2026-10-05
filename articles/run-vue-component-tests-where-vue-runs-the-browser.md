---
title: 'Run Vue Component Tests Where Vue Runs: The Browser'
description: >-
  @testing-library/vue's render() works inside a running dev server, so
  component tests execute in the browser the component ships to: real layout,
  real CSS, real reactivity, next to your flow tests in the same session.
date: '2026-08-31'
tags:
  - testing
  - twd
  - vue
  - frontend
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.us-east-2.amazonaws.com%2Fuploads%2Farticles%2Fwi8yqnt2rysn3cpjcitx.png
devto_url: >-
  https://dev.to/kevinccbsg/run-vue-component-tests-where-vue-runs-the-browser-c2l
---
A Vue component's job is to produce DOM in a browser. Most component tests ask it to do that somewhere else: in Node, against a DOM that jsdom simulates. That has been the default since `npm create vue@latest` started offering Vitest with jsdom, and for plenty of tests it is the right trade. It does set a ceiling on what a green test proves, though. Nothing is ever drawn. Your CSS never runs and nothing has a size or a position, so a component can pass every assertion in the file and still be broken on screen.

I co-maintain [twd-js](https://www.npmjs.com/package/twd-js), which runs tests inside your actual dev server, in a sidebar, next to the app. It was built for flow testing: visit a route, click through the app, assert on what the user sees. Component testing was the thing it did not do.

Then I tried calling `render()` from [@testing-library/vue](https://www.npmjs.com/package/@testing-library/vue) inside a TWD test.

```ts
import { afterEach, describe, it } from "twd-js/runner";
import { twd, userEvent } from "twd-js";
import { render, screen, cleanup } from "@testing-library/vue";
import HomeView from "../../views/HomeView.vue";
import { componentHost, restorePage } from "../support/componentHost";

describe("HomeView component", () => {
  afterEach(() => {
    cleanup();
    restorePage();
  });

  it("increments the counter on click", async () => {
    // componentHost() is a blank div on an empty page. More on it below.
    render(HomeView, { container: componentHost() });

    const button = await screen.findByTestId("counter-button");
    twd.should(button, "contain.text", "Count is 0");

    await userEvent.click(button);
    twd.should(button, "contain.text", "Count is 1");
  });
});
```

Nothing broke. The component mounts into the page, the sidebar shows it running, and reactivity does what reactivity does, in a browser, against a DOM nobody had to simulate.

## Why this works at all

Vue Testing Library is a thin layer. `render()` mounts your component with `@vue/test-utils` and binds `@testing-library/dom` queries to the result. Neither of those is tied to jsdom. jsdom is just the DOM most people hand them.

Give them a real one and the same code runs, except now the component is actually on a screen, with a real size, a real position, and your CSS applied to it. TWD already runs inside your app in the browser, so the real DOM is right there.

## The setup

One helper, and no changes to your app.

`render()` appends its container to `document.body`, so the component lands after `#app`, a full viewport below your layout. The app is also still on the page, so `screen` matches its elements as well as the ones your test just rendered. Both of those are the same problem: the app is in the way.

```ts
const HOST_ID = "twd-component-host";
const APP_ROOT_ID = "app";

let appRoot: HTMLElement | null = null;
let placeholder: Comment | null = null;

export function componentHost(): HTMLElement {
  detachApp();

  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement("div");
    host.id = HOST_ID;
  }
  if (!host.isConnected) {
    document.body.prepend(host);
  }

  host.innerHTML = "";
  return host;
}

export function restorePage(): void {
  document.getElementById(HOST_ID)?.remove();
  attachApp();
}

function detachApp(): void {
  if (placeholder) return;

  const root = document.getElementById(APP_ROOT_ID);
  if (!root) return;

  appRoot = root;
  placeholder = document.createComment(" app detached by twd component test ");
  root.replaceWith(placeholder);
}

function attachApp(): void {
  if (!placeholder || !appRoot) return;

  placeholder.replaceWith(appRoot);
  placeholder = null;
  appRoot = null;
}
```

Detaching the app root is not the same as emptying it. `app.innerHTML = ""` pulls the DOM out from under Vue while its vnodes still point at those nodes, and the next router navigation patches elements that are no longer in the document. Moving the node out and putting it back leaves that correspondence intact, so `restorePage()` returns a live app.

`prepend` rather than `append` puts the component at the top of the page. It also keeps it in normal flow, which matters in a browser: the page is offset to make room for the TWD sidebar, and anything in normal flow inherits that offset for free.

One detail worth keeping: `cleanup()` and `restorePage()` belong in `afterEach`, not `beforeEach`. In jsdom the environment is torn down for you between files. In a real browser it is not, so renders stack up, and your flow tests need the app back before they run.

That is the whole setup. Your app does not change.


![twd testing component execution](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/5s9myvgv58am49w3j0jh.png)



## The part that changes how the test reads

Here is the same idea on a view that fetches on mount and posts a form.

```ts
it("posts the form values when a todo is created", async () => {
  await twd.mockRequest("getTodoList", {
    method: "GET",
    url: "/api/todos",
    response: [],
    status: 200,
  });
  await twd.mockRequest("createTodo", {
    method: "POST",
    url: "/api/todos",
    status: 201,
    response: { id: "1", title: "Write the Vue post", description: "In a real browser", date: "2026-09-01" },
  });

  render(TodosView, { container: componentHost() });
  await twd.waitForRequest("getTodoList");

  await userEvent.type(await screen.findByLabelText("Title"), "Write the Vue post");
  await userEvent.type(screen.getByLabelText("Description"), "In a real browser");
  await userEvent.type(screen.getByLabelText("Date"), "2026-09-01");

  await userEvent.click(screen.getByRole("button", { name: "Create Todo" }));

  const rule = await twd.waitForRequest("createTodo");
  expect(rule.request).to.deep.equal({
    title: "Write the Vue post",
    description: "In a real browser",
    date: "2026-09-01",
  });
});
```

Nothing here is stubbed except the network. The component's `onMounted`, its `ref` state, the `v-model` bindings and the axios call all run for real, and the assertion is on the request that actually left the browser. In jsdom that test usually starts with a `vi.mock` of the API module, and from then on you are asserting that your component calls your mock correctly.

`userEvent` here comes from `twd-js`, which re-exports [@testing-library/user-event](https://www.npmjs.com/package/@testing-library/user-event) so there is nothing extra to install. It drives `v-model` the way a person does, one key event at a time, and in a real browser those are real key events.

## Both kinds of test, one run

Component tests and flow tests are now the same kind of artifact. Files in the same project, listed in the same sidebar, running in the same browser session against the same bundle. There is no second runner, no second DOM, and no second config to keep in sync.

The one thing to configure is the other direction. If you also run Vitest in the same repo, exclude the browser tests from it, or Vitest will collect them, find no `describe` it recognises, and fail the run:

```ts
test: {
  exclude: [...configDefaults.exclude, "**/*.twd.test.*"],
},
```

## Where each style fits

Rendering a component in isolation is the right move when the component is the subject: a form's validation states, a modal that opens and closes, a table that sorts. You skip the navigation, you skip the fixtures, and the test says exactly what it is about.

Flow tests stay the right move for anything that crosses a boundary. Routing, data loading, a sequence of screens, state that survives a navigation. Rendering a component in isolation to test those means rebuilding the app around it, which is how component test files end up longer than the components.

The useful change is not that one replaced the other. It is that choosing between them is now a decision about scope, made per test, instead of a decision about which runner and which DOM you are committing to.

## Try it

If you already have Vue Testing Library tests, copy one, change the imports for `describe` and `it` to `twd-js/runner`, and hand `render()` the component host. The rest of the test stays as it is.

The example app is on GitHub, with the same component tested in jsdom and in the browser side by side: [BRIKEV/twd-vue-example](https://github.com/BRIKEV/twd-vue-example).

I wrote the React version of this first, if you want the same walkthrough with `@testing-library/react`: [No More Fake DOM](/posts/no-more-fake-dom-testing-library-unit-tests-in-the-real-browser).
