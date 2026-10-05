import { Link } from "react-router";
import type { Route } from "./+types/home";
import { getAllPosts } from "~/lib/posts.server";
import { pageMeta, SITE } from "~/lib/site";
import { PostList } from "~/components/post-list";
import { TestRun } from "~/components/test-run";

export async function loader() {
  const posts = await getAllPosts();
  return { latest: posts.slice(0, 6), total: posts.length };
}

export const meta: Route.MetaFunction = () =>
  pageMeta({ description: SITE.headline, path: "/" });

export default function Home({ loaderData }: Route.ComponentProps) {
  const { latest, total } = loaderData;
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Building software with confidence, for developers and their AI assistants.</h1>
          <p className="lede">
            I'm Kevin Martínez, a software architect working on testing strategy, developer
            experience and responsible AI adoption. I created TWD, an open-source way to run your
            tests inside the app you're building.
          </p>
          <p className="hero-actions">
            <Link to="/posts" className="button">Read the posts</Link>
            <a href={SITE.links.twd} className="button button-quiet">What is TWD?</a>
          </p>
        </div>
        <div className="hero-visual">
          <img
            className="hero-portrait"
            src="/kevin-portrait.jpg"
            alt="Kevin Martínez with arms crossed, wearing a TWD t-shirt"
            width="640"
            height="800"
            fetchPriority="high"
          />
          <TestRun />
        </div>
      </section>

      <section className="section" aria-labelledby="latest-heading">
        <div className="section-head">
          <h2 id="latest-heading">Latest writing</h2>
          <Link to="/posts">All {total} posts</Link>
        </div>
        <PostList posts={latest} />
      </section>

      <section className="section twd-band" aria-labelledby="twd-heading">
        <img src="/twd-logo.png" alt="" width="72" height="74" />
        <div>
          <h2 id="twd-heading">TWD: Test While Developing</h2>
          <p>
            Frontend tests that run in the browser you develop in. Write them yourself, or let your
            AI agent write, run and fix them for you. Mock APIs, check contracts against OpenAPI,
            and run the same suite headless in CI.
          </p>
          <ul className="inline-links">
            <li><a href={SITE.links.twd}>Docs at twd.dev</a></li>
            <li><a href={SITE.links.twdGithub}>Source on GitHub</a></li>
            <li><a href={SITE.links.twdNpm}>twd-js on npm</a></li>
          </ul>
        </div>
      </section>
    </>
  );
}
