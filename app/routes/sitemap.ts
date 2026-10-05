import { getAllPosts } from "~/lib/posts.server";
import { SITE } from "~/lib/site";

export async function loader() {
  const posts = await getAllPosts();
  const urls = [
    { loc: "/", lastmod: posts[0]?.date },
    { loc: "/posts", lastmod: posts[0]?.date },
    { loc: "/about" },
    ...posts.map((p) => ({ loc: `/posts/${p.slug}`, lastmod: p.date })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${SITE.url}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
  .join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
