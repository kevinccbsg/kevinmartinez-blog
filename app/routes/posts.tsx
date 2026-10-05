import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/posts";
import { getAllPosts } from "~/lib/posts.server";
import { pageMeta } from "~/lib/site";
import { PostList } from "~/components/post-list";
import type { PostMeta } from "~/lib/posts.server";

const FEATURED_TAG_COUNT = 12;

export async function loader() {
  return { posts: await getAllPosts() };
}

export const meta: Route.MetaFunction = () =>
  pageMeta({
    title: "Posts",
    description: "Everything I've written about testing, TWD, React Router and AI-assisted development.",
    path: "/posts",
  });

function topTags(posts: PostMeta[]) {
  const counts = new Map<string, number>();
  for (const post of posts) for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, FEATURED_TAG_COUNT)
    .map(([tag]) => tag);
}

function groupByYear(posts: PostMeta[]) {
  const groups = new Map<string, PostMeta[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), post]);
  }
  return [...groups.entries()];
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  const { posts } = loaderData;
  const [searchParams] = useSearchParams();
  // The HTML is prerendered without a query string, so apply ?tag= only after hydration.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const activeTag = hydrated ? searchParams.get("tag") : null;

  const tags = useMemo(() => topTags(posts), [posts]);
  const visible = activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts;

  return (
    <div className="page">
      <h1 className="page-title">Posts</h1>
      <p className="lede">
        {posts.length} posts on testing, TWD, React Router and working with AI. Posts marked ES are in
        Spanish.
      </p>

      <nav className="tag-filter" aria-label="Filter by tag">
        <Link to="/posts" aria-current={activeTag ? undefined : "page"}>All</Link>
        {tags.map((tag) => (
          <Link key={tag} to={`/posts?tag=${encodeURIComponent(tag)}`} aria-current={activeTag === tag ? "page" : undefined}>
            {tag}
          </Link>
        ))}
      </nav>

      {activeTag && (
        <p className="filter-status" role="status">
          {visible.length} {visible.length === 1 ? "post" : "posts"} tagged “{activeTag}”.{" "}
          <Link to="/posts">Show all posts</Link>
        </p>
      )}

      {visible.length === 0 ? (
        <p>No posts use that tag yet. <Link to="/posts">Show all posts</Link></p>
      ) : (
        groupByYear(visible).map(([year, yearPosts]) => (
          <section key={year} className="year-group" aria-labelledby={`year-${year}`}>
            <h2 id={`year-${year}`}>{year}</h2>
            <PostList posts={yearPosts} />
          </section>
        ))
      )}
    </div>
  );
}
