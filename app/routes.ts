import { type RouteConfig, index, route } from "@react-router/dev/routes";

const isProduction = process.env.NODE_ENV === "production";

export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts.tsx"),
  route("posts/:slug", "routes/post.tsx"),
  route("about", "routes/about.tsx"),
  route("rss.xml", "routes/rss.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  // Blank mount point for TWD component tests; dev only.
  ...(isProduction ? [] : [route("testing", "routes/testing.tsx")]),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
