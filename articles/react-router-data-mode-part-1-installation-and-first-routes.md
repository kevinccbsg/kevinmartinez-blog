---
title: 'React Router Data Mode: Part 1 - Installation and first routes'
description: >-
  In this series, we will focus on the Data Mode, which is undoubtedly my
  favorite for creating well-structured and maintainable SPAs.
date: '2025-06-26'
tags:
  - webdev
  - javascript
  - react
  - reactrouter
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fj31j4dj0jiog2y2vx1j7.webp
devto_url: >-
  https://dev.to/kevinccbsg/react-router-data-mode-part-1-installation-and-first-routes-3c40
---
In this series, we will focus on the **Data Mode**, which is undoubtedly my favorite for creating well-structured and maintainable SPAs.

This series will have several parts, which you can see below:

1. [Installation and first routes](/posts/react-router-data-mode-part-1-installation-and-first-routes)
2. [Nested routes and Outlet](/posts/react-router-data-mode-part-2-nested-routes-and-outlets)
3. [Loaders](/posts/react-router-data-mode-part-3-loaders-and-data-fetching)
4. [Routes with parameters, useRouteLoaderData, and useParams](/posts/react-router-data-mode-part-4-routes-with-parameters-userouteloaderdata-and-useparams)
5. [useParams, Navlink](/posts/react-router-data-mode-part-5-refactor-useparams-and-navlink)
6. [Actions](/posts/react-router-data-mode-part-6-actions-forms-and-mutations)
7. [Multiple actions and form handling on a single page](/posts/react-router-data-mode-part-7-multiple-actions-and-form-handling)
8. [Form validation and useFetcher](/posts/react-router-data-mode-part-8-validations-usefetcher-and-react-hook-form)
9. [Optimistic UI with useFetcher](/posts/react-router-data-mode-part-9-optimistic-ui-with-usefetcher)
10. [Testing with Vitest and React Testing Library](/posts/react-router-data-mode-part-10-testing-with-vitest-and-react-testing-library)

All parts will be explained in this repository, which already comes prepared with some components and style libraries like **shadcn/ui** and **Tailwind**.

---

## What are we going to build?

A contact application where we will practice nested routes, data loading and mutation, navigation, validations, etc.

![Contact web app demo for React Router](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/n6xpdv53npyen4bqoj8w.gif)

Let's get started!

## Installation and first routes

The first step is to clone the [base repository](https://github.com/kevinccbsg/react-router-tutorial-devto).

In your terminal:

```bash
git clone git@github.com:kevinccbsg/react-router-tutorial-devto.git
# Move to the initial tag
git checkout 00-init-project
```

Install the dependencies:

```bash
npm i
```

This project is created with **Vite** and has the **shadcn/ui** library integrated. We won't explain that part here, but if you'd like a tutorial on Vite + shadcn, let me know in the comments.

Now start the project:

```bash
npm run dev
```

You will see something very simple on the screen: an `<h1>` with the text "Welcome to React!". Let's change that and start using **React Router (Data Mode)**.

## Install React Router

Run:

```
npm i react-router
```

Create a new file called `src/AppRoutes.tsx`, which will contain our route configuration:

```tsx
import { createBrowserRouter } from "react-router";

const AppRoutes = createBrowserRouter([
  {
    path: "/",
    element: <div>Home</div>,
  },
  {
    path: "/about",
    element: <div>About</div>,
  },
  {
    path: "*",
    element: <div>Not Found</div>,
  },
]);

export default AppRoutes;
```

Unlike the Declarative Mode (where we use `<Routes>` and `<Route>`), in Data Mode, we define routes as objects. Each object represents a route and can include elements like `element`, `loader`, `action`, etc.

In this example:

- `/` displays a simple "Home"
- `/about` displays "About"
- `*` captures any undefined route (what React Router calls a "splat") and displays "Not Found"

## Connect the router with React

To activate React Router, we need to connect it in `main.tsx`. Edit the file as follows:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router";
import router from './AppRoutes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

Done! If you visit `/`, `/about`, or any other route, you should see the corresponding content.

## What's next?

In the next part, we will build the real structure of the application, see how to use `Outlet` for nested routes, `Link`, and create a base layout.

See you in [part 2](/posts/react-router-data-mode-part-2-nested-routes-and-outlets).
