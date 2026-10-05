import { getAllPosts } from "~/lib/posts.server";
import { SITE } from "~/lib/site";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function loader() {
  const posts = await getAllPosts();
  const items = posts
    .map((post) => {
      const url = `${SITE.url}/posts/${post.slug}`;
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(post.description)}</description>
${post.tags.map((t) => `      <category>${escape(t)}</category>`).join("\n")}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name}</title>
    <link>${SITE.url}</link>
    <description>${escape(SITE.headline)}</description>
    <language>en</language>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
