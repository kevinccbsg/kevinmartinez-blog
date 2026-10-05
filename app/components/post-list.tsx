import { Link } from "react-router";
import type { PostMeta } from "~/lib/posts.server";
import { formatDate } from "~/lib/site";

export function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <ol className="post-list">
      {posts.map((post) => (
        <li key={post.slug} lang={post.lang === "es" ? "es" : undefined}>
          <time dateTime={post.date}>{formatDate(post.date, post.lang)}</time>
          <div>
            <h3>
              <Link to={`/posts/${post.slug}`}>{post.title}</Link>
              {post.lang === "es" && <LangBadge />}
            </h3>
            <p>{post.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LangBadge() {
  return (
    <abbr className="lang-badge" title="Written in Spanish" lang="en">
      ES
    </abbr>
  );
}
