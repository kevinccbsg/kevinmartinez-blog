# kevinmartinez.dev

Personal blog of Kevin Martínez. React Router 8, fully prerendered to static HTML,
deployed on Netlify. Tested with [TWD](https://twd.dev).

## Write a post

Add a markdown file to `articles/`. The filename is the URL: `articles/my-post.md`
becomes `/posts/my-post`.

```md
---
title: My post
description: One or two sentences. Used in lists and as the meta description.
date: 2026-10-05
tags: testing, twd          # or a YAML list
cover_image: https://...    # optional
lang: es                    # optional, for Spanish posts
devto_url: https://dev.to/kevinccbsg/...   # optional, shows "also on dev.to"
canonical_url: https://...  # optional, defaults to this site
draft: true                 # optional, hides the post
---

Post body in markdown.
```

Push to `main` and Netlify rebuilds. A missing `title`, `description` or `date` fails
the build with the file name in the error.

## Re-import from dev.to

```bash
npm run import:devto              # every published article
npm run import:devto -- my-slug   # only articles whose slug contains "my-slug"
```

Uses the public dev.to API (no key). Overwrites the matching files in `articles/`.
Descriptions come from `../twd-social/articles` when a post with the same title exists
there, otherwise from the first paragraph.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5180 with the TWD sidebar |
| `npm run build` | Prerender every page to `build/client` |
| `npm run check:build` | Assert the built HTML has titles, meta tags and body text |
| `npm run test:ci` | Run the TWD tests headless (needs `npm run dev` running) |
| `npm run typecheck` | Generate route types and run `tsc` |

## Netlify

`netlify.toml` sets the build command, the publish folder (`build/client`), Node 24,
and redirects for the old Gatsby URLs (`/pages/about`, `/category/*`).
