---
title: TWD 1.4.x is out – focused on Developer Experience
description: >-
  We’ve just released TWD 1.4.x, and this version is all about improving the
  developer experience while testing.
date: '2026-01-11'
tags:
  - webdev
  - testing
  - twd
cover_image: >-
  https://media2.dev.to/dynamic/image/width=1000,height=420,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F059plz3ka5t0uzt7nxgy.png
devto_url: 'https://dev.to/kevinccbsg/twd-14x-is-out-focused-on-developer-experience-3fh9'
---
We’ve just released [**TWD 1.4.x**](https://www.npmjs.com/package/twd-js), and this version is all about **improving the developer experience** while testing.

## What’s new?

### Better testing flow

- The sidebar now remembers whether it was open or closed using session storage.
- When you reload the page while testing, TWD brings you back to the same test, so you can continue right where you left off.

### Custom theming

- You can now theme the sidebar to match your product or brand colors.
- This makes TWD feel more integrated into your app instead of a foreign tool.

Theming docs: https://twd.dev/theming.html

## New testing examples

We’ve added more real-world examples to show how TWD fits into modern apps:

- **React Router framework** mode testing examples: https://twd.dev/frameworks.html#react-router-framework-mode

- Auth0 authorization flow testing: https://github.com/BRIKEV/twd-auth0

## shadcn/ui testing guide

If you’re using shadcn/ui, we also published a full guide showing how to test all its components using TWD: https://brikev.github.io/twd-shadcn/

---

This isn’t a massive release in terms of features, but it includes several UX and DX improvements, plus a refreshed default theme, to make day-to-day testing smoother and more pleasant.

As always, feedback is welcome.
