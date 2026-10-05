# CLAUDE.md

Personal blog for kevinmartinez.dev. See README.md for commands and the post format.

- React Router 8 framework mode with `ssr: false` + `prerender` (react-router.config.ts):
  every route is static HTML at build time. Any new route with a loader must be added to
  the `prerender` list or the build fails.
- `app/lib/posts.server.ts` is the only code that reads `articles/`;
  `app/lib/markdown.server.ts` renders markdown (marked + shiki dual theme).
- The dev server is pinned to port 5180 with `strictPort` because `twd.config.json`
  points there. Don't change one without the other.
- TWD tests live in `app/twd-tests/`. They mount route components into the dev-only
  `/testing` page (rendered without site chrome) through `createRoutesStub` with
  fixture data from `utils.tsx`.
- The TWD init scripts in `root.tsx` must stay after `<Scripts />`, otherwise test
  files load before React Router's HMR preamble and the sidebar never appears.
- `twd-js`, `twd-relay` and `twd-cli` are pinned to exact versions.
- Design tokens are CSS variables at the top of `app/app.css` (TWD teal palette,
  light and dark).
