---
title: 'React Router v7: The Evolution React Needed'
description: >-
  If you're reading this, you're probably working with React or learning how to
  use it. And if that’s the case, you’ve surely heard of react-router, the most…
date: '2025-05-28'
tags:
  - webdev
  - programming
  - react
  - reactrouter
devto_url: 'https://dev.to/kevinccbsg/react-router-v7-the-evolution-react-needed-40d3'
---
If you're reading this, you're probably working with React or learning how to use it. And if that’s the case, you’ve surely heard of `react-router`, the most popular library for routing in React apps for years.

But what you may not know is that in its latest version, React Router has evolved significantly. It now incorporates concepts from **Remix** like `loaders`, `actions`, `ErrorBoundaries`, `SSR support`, and more.

**Remix**? That’s right. The Remix framework has always been built on top of React Router. But with this new version (v7), the experience has been unified—now you can use that same architecture directly in React Router, without needing to adopt a full framework.

## What Does React Router v7 Offer?

The best way to understand what React Router v7 brings is by looking at its **three usage modes**, each designed for different levels of complexity and application needs:

1. Declarative Mode
2. Data Mode
3. Framework Mode

Let’s break down what each one is and when to use them.

### Declarative Mode

This is the classic approach you’re probably already familiar with. You use components like `<Routes>` and `<Route>` to define your routes, along with hooks like `useNavigate`, `useParams`, and so on.

```js
<Routes>
  <Route index element={<Home />} />
  <Route path="about" element={<About />} />

  <Route element={<AuthLayout />}>
    <Route path="login" element={<Login />} />
    <Route path="register" element={<Register />} />
  </Route>

  <Route path="concerts">
    <Route index element={<ConcertsHome />} />
    <Route path=":city" element={<City />} />
    <Route path="trending" element={<Trending />} />
  </Route>
</Routes>
```

This mode is perfect if you want a simple SPA using your own bundler (Vite, Webpack...), managing state with Zustand, Redux, or react-query, and you don’t need server-side rendering (SSR).

### Data Mode

This is where React Router v7 really transforms. Instead of using components to define routes, you use a route config object. Each route can have a loader (to fetch data) and an action (to handle forms or mutations).

```js
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Hello World</div>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
```

A more complete example with a `loader` and `action`:

```js
createBrowserRouter([
  {
    path: "/items",
    loader,
    action,
    Component: Items,
  },
]);

async function loader() {
  const items = await fakeDb.getItems();
  return { items };
}

async function action({ request }) {
  const data = await request.formData();
  await fakeDb.addItem({ title: data.get("title") });
  return { ok: true };
}

function Items() {
  const data = useLoaderData();
  return (
    <div>
      <TodoList items={data.items} />
      <Form method="post">
        <input type="text" name="title" />
        <button type="submit">Crear</button>
      </Form>
    </div>
  );
}
```

This mode is ideal if you're building a complex SPA and want to avoid useEffect chaos, centralizing your data flow. You can also keep your current stack and deploy wherever you want (Vercel, Netlify, Firebase, etc.).

📌 I recommend checking out this [ejemplos](https://github.com/kevinccbsg/react-router-tutorials/tree/main/react-router-data), and stay tuned—I'll be publishing more articles on how to make the most of this mode.

### Framework Mode

This mode turns React Router into a full framework with SSR support. You start from scratch using a CLI, and it’s designed for apps that need SEO or super-fast initial loads.

It has the best TypeScript support, shares the `loaders` and `actions` concept from Data Mode, and gives you full control.

👉 However, keep in mind:

- You need to define your deployment setup from the start.
- Not all libraries work well with SSR.
- Your team should understand the difference between CSR and SSR.
- It works best with Tailwind or styling approaches compatible with SSR.

That said, if your app is private or doesn’t need SEO, I’d recommend sticking with Declarative or Data Mode to avoid unnecessary complexity.

## So, Is It Worth It?

Many React frameworks are adding complexity to the frontend with their latest updates. React Router v7 gives you a clear, flexible alternative:

- Start with Declarative Mode if you just need routing.
- Move to Data Mode to better manage data and forms.
- And go full Framework Mode only if SSR is truly required.

All without locking yourself into a single approach from day one.

💡 In upcoming posts, I’ll dive deeper into `loaders`, `actions`, and data-mode architecture—building projects from scratch, testing, and real-world integrations.

Are you interested in React Router v7? Want to see practical examples or comparisons with other solutions? Let me know in the comments—I’d love to hear from you.
