# kevinmartinez.dev blog — design

Date: 2026-10-05
Status: approved in conversation, pending written-spec review

## Goal

A simple, clean personal blog at `https://www.kevinmartinez.dev` that replaces the
existing Gatsby site on the same Netlify site. It presents Kevin Martínez as a
software engineer focused on engineering quality and testing, with **TWD
(twd.dev)** as the centre of gravity, and hosts every article Kevin has published
on dev.to.

Success criteria:

1. Every route is a complete, crawler-readable HTML file at build time (SEO parity
   with the Gatsby site).
2. Publishing a post = add a markdown file to `articles/`, push. Nothing else.
3. All 79 published dev.to articles are on the blog with their real publish dates.
4. Old Gatsby URLs keep working or redirect sensibly.
5. The blog is tested with `twd-js` and runs those tests in CI with `twd-cli`.

## Non-goals

Comments, search, newsletter, analytics, pagination, CMS, i18n UI, image
self-hosting, automated dev.to sync.

## Stack

- React Router **8** framework mode (`@react-router/dev` + `react-router`, 8.4.x).
- `react-router.config.ts`: `ssr: false`, `prerender` = async function returning
  every path (`/`, `/posts`, `/about`, `/posts/<slug>` for every article,
  `/rss.xml`, `/sitemap.xml`). Output: static HTML per route in `build/client`.
  This is static-site generation, not SPA mode: each HTML file contains the
  rendered article, `<title>`, meta description, Open Graph/Twitter tags and a
  canonical link.
- Vite 8, TypeScript, Tailwind 4 (`@tailwindcss/vite`, `@tailwindcss/typography`
  for article bodies).
- Markdown: `gray-matter` (frontmatter) + `marked` (HTML) + `shiki` (code
  highlighting, dual light/dark theme), all run in route loaders at build time.
  No markdown code ships to the browser beyond the rendered HTML.
- Netlify: static deploy, no functions. `netlify.toml` with
  `command = "npm run build"`, `publish = "build/client"`, Node 24.

## Content model

`articles/<slug>.md`, flat folder. The filename is the slug and the URL is
`/posts/<slug>`.

Frontmatter:

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `description` | yes | meta description + list excerpt |
| `date` | yes | `YYYY-MM-DD`; sort key, newest first |
| `tags` | no | comma-separated string (dev.to style) **or** YAML list — both accepted |
| `cover_image` | no | absolute URL (dev.to CDN is fine) |
| `lang` | no | `en` (default) or `es`; `es` shows an "ES" badge and sets `lang="es"` on the article |
| `canonical_url` | no | overrides the default canonical (`https://www.kevinmartinez.dev/posts/<slug>`) |
| `series` | no | shown as a label on the post |
| `devto_url` | no | if set, post footer shows "Also on dev.to" |

`app/lib/posts.server.ts` is the only module that touches the filesystem. It
exposes `getAllPosts()` (metadata, sorted) and `getPost(slug)` (metadata +
rendered HTML). It throws at build time on a missing required field, so a bad
file fails the build loudly instead of shipping a broken page.

Posts with `draft: true` in frontmatter are skipped (escape hatch; dev.to imports
never set it).

### dev.to import

`scripts/import-devto.mjs`, run with `npm run import:devto`. One-shot, re-runnable.

- `GET https://dev.to/api/articles?username=kevinccbsg&per_page=1000` (public, no
  API key), then `GET /api/articles/{id}` per article for `body_markdown`, spaced
  to respect rate limits.
- Slug = dev.to slug minus its trailing random suffix
  (`when-your-mocks-lie-contract-testing-with-twd-2e58` →
  `when-your-mocks-lie-contract-testing-with-twd`).
- Writes `date` (from `published_at`), `title`, `description`, `tags`,
  `cover_image`, `devto_url`, `series` when present, and `lang: es` when the
  article is Spanish (dev.to `language` field, falling back to a heuristic on
  the title/slug: `parte-`, `con-`, `que-`, `la-`).
- dev.to liquid tags (`{% embed %}`, `{% youtube %}`, `{% github %}`, etc.) are
  converted to plain links or a YouTube iframe so they don't leak as raw text.
- Existing files are overwritten (dev.to is the source when re-importing). The
  script prints a summary of created/updated files.
- Images stay on the dev.to CDN.

### Old Gatsby posts

`/posts/easy-docs-nodejs-api` and `/posts/easy-validation-nodejs-api` are scraped
once from the live site into `articles/` as markdown (original date kept), so
their URLs keep resolving. Done by hand as part of implementation, not a script.

## Routes

| Path | File | Content |
|---|---|---|
| `/` | `routes/home.tsx` | Hero (name, headline, one-paragraph pitch), TWD card (what it is + links: twd.dev, GitHub, npm), latest 6 posts, link to all posts |
| `/posts` | `routes/posts.tsx` | All posts, newest first, grouped by year. Tag filter via `?tag=` (client-side filter on prerendered list; no per-tag pages) |
| `/posts/:slug` | `routes/post.tsx` | Title, date, tags, ES badge, series label, cover image, rendered body, "Also on dev.to" link, back link |
| `/about` | `routes/about.tsx` | Kevin's bio (text below), "Why TWD" section, interests, links (LinkedIn, dev.to, GitHub, twd.dev) |
| `/rss.xml` | `routes/rss[.]xml.ts` | RSS 2.0 of all posts |
| `/sitemap.xml` | `routes/sitemap[.]xml.ts` | All prerendered HTML paths |
| `/testing` | `routes/testing.tsx` | Dev-only blank page used as the TWD test host (not prerendered, not in the sitemap) |
| 404 | root `ErrorBoundary` + `*` route | Simple not-found page, prerendered once and copied to `build/client/404.html` after build, which Netlify serves for unknown paths |

Every page route exports `meta` with title, description, `og:*`, `twitter:card`,
and canonical link.

Redirects in `netlify.toml`:

- `/pages/about` → `/about` (301)
- `/category/*` → `/posts` (301)

## About content

Name: Kevin Julián Martínez Escobar.
Headline: Senior Software Engineer | Engineering Quality | Testing Strategy |
AI-Assisted Development | Creator of twd.dev.

Bio: Kevin's LinkedIn "About" text, verbatim apart from light formatting into
paragraphs. Full career history is delegated to a LinkedIn link
(`https://www.linkedin.com/in/kevinjmartinez/`). An optional photo at
`public/kevin.jpg` is used if present.

## Visual design

- Text-first, single column (~70ch for article bodies), generous whitespace,
  system font stack for UI; monospace for code.
- Colors from TWD docs (`twd/docs/.vitepress/theme/style.css`):
  - light: primary `#123956` (deep teal), hover `#1a5270`
  - dark: primary `#2faaae` (teal), button surface `#1a7c80`, background `#1b1b1f`
  - accent: TWD success green (`#1a7f37` light / `#3fb950` dark) used sparingly
    (e.g. the TWD card's "passing" dot).
- Light/dark follows `prefers-color-scheme` plus a toggle in the header
  (persisted in `localStorage`, applied by an inline script before paint to avoid
  a flash).
- Favicon and TWD logo copied from `twd/docs/public`. A default OG image is
  used for pages without a cover.
- Accessibility: visible focus ring (same rule as TWD docs), AA contrast in both
  themes, skip link, semantic landmarks.

Header: "Kevin Martínez" (home link) · Posts · About · theme toggle.
Footer: links to twd.dev, GitHub, LinkedIn, dev.to, RSS.

## Testing

- `twd-js`, `twd-relay`, `twd-cli` as devDependencies, **pinned to exact
  versions** (1.10.1 / 1.4.0 / 1.10.0).
- Vite plugins `twd({ testFilePattern: '/**/*.twd.test.{ts,tsx}' })` and
  `twdRemote()`; TWD init + relay scripts injected in `root.tsx` only under
  `import.meta.env.DEV`, mirroring `twd-react-router`.
- Tests in `app/twd-tests/`, which use the real dev server and real markdown
  (no mocks needed; content is local):
  - home lists latest posts and links to a post
  - post page renders title, date, body and code block
  - Spanish post shows the ES badge
  - posts page `?tag=` filter narrows the list
  - about page shows bio and external links
  - theme toggle switches and persists the theme
- `twd.config.json` points at `http://localhost:5173/testing`.
- `npm run test:ci` = `twd-cli run`.
- **Build check** (`npm run check:build`, plain Node script): after `vite build`,
  asserts that `build/client/posts/<known-slug>/index.html` contains the article
  title, meta description, `og:title`, canonical link and a sentence from the
  body, and that `rss.xml`/`sitemap.xml` exist and list the same number of posts
  as `articles/`. This guards the SEO requirement.
- GitHub Actions `ci.yml` on push/PR to `main`: `npm ci` → typecheck → build →
  `check:build` → start dev server → `wait-on` → install Chrome for Puppeteer →
  `npm run test:ci`. Same shape as `twd-react-router`'s workflow.

## Repo

New git repo at `/Users/kevinccbsg/brikev/kevinmartinez-twd-blog`; Kevin creates
the GitHub remote and points the Netlify site at it. Includes `README.md` (how to
add a post, how to re-import from dev.to) and a short `CLAUDE.md`.
