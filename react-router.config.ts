import type { Config } from "@react-router/dev/config";
import { getAllPosts } from "./app/lib/posts.server";

export default {
  // Static site: every path below is rendered to a full HTML file at build time.
  ssr: false,
  async prerender() {
    const posts = await getAllPosts();
    return [
      "/",
      "/posts",
      "/about",
      "/404",
      "/rss.xml",
      "/sitemap.xml",
      ...posts.map((post) => `/posts/${post.slug}`),
    ];
  },
} satisfies Config;
