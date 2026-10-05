import { data, Link } from "react-router";
import type { Route } from "./+types/post";
import { getPost } from "~/lib/posts.server";
import { renderMarkdown } from "~/lib/markdown.server";
import { formatDate, pageMeta } from "~/lib/site";
import { LangBadge } from "~/components/post-list";

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPost(params.slug);
  if (!post) throw data(null, { status: 404 });
  const { body, ...meta } = post;
  return { post: meta, html: await renderMarkdown(body) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: "Post not found | Kevin Martínez" }];
  const { post } = loaderData;
  return pageMeta({
    title: post.title,
    description: post.description,
    path: `/posts/${post.slug}`,
    image: post.coverImage,
    type: "article",
    canonical: post.canonicalUrl,
    publishedTime: post.date,
  });
};

export default function PostPage({ loaderData }: Route.ComponentProps) {
  const { post, html } = loaderData;
  return (
    <article className="article" lang={post.lang}>
      <header className="article-header">
        <p className="article-meta">
          <time dateTime={post.date}>{formatDate(post.date, post.lang)}</time>
          {post.lang === "es" && <LangBadge />}
          {post.series && <span className="series">Series: {post.series}</span>}
        </p>
        <h1>{post.title}</h1>
        <p className="lede">{post.description}</p>
        {post.tags.length > 0 && (
          <ul className="tags" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link to={`/posts?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
              </li>
            ))}
          </ul>
        )}
      </header>
      {post.coverImage && (
        <img className="cover" src={post.coverImage} alt="" width="1000" height="420" />
      )}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <footer className="article-footer" lang="en">
        {post.devtoUrl && (
          <p>
            This post is also on <a href={post.devtoUrl}>dev.to</a>, where you can leave a comment.
          </p>
        )}
        <p><Link to="/posts">Back to all posts</Link></p>
      </footer>
    </article>
  );
}
