import { twd, screenDom, expect } from "twd-js";
import { beforeEach, describe, it } from "twd-js/runner";
import PostPage from "~/routes/post";
import { posts, renderRoute, setupReactRoot } from "./utils";

const html = `<p>Every mock you write is a claim about what your backend returns.</p>
<pre class="shiki"><code><span>await twd.mockRequest("userList", {})</span></code></pre>`;

describe("Post page", () => {
  beforeEach(async () => {
    await setupReactRoot();
  });

  it("renders the title, date, tags and body", async () => {
    renderRoute(PostPage, { path: "/posts/:slug", url: `/posts/${posts[0].slug}`, loaderData: { post: posts[0], html } });

    const title = await screenDom.findByRole("heading", { level: 1 });
    twd.should(title, "have.text", posts[0].title);
    twd.should(await screenDom.findByText("19 Apr 2026"), "be.visible");
    twd.should(await screenDom.findByText(/Every mock you write is a claim/), "be.visible");
    twd.should(await screenDom.findByText('await twd.mockRequest("userList", {})'), "be.visible");

    const tags = await screenDom.findByRole("list", { name: "Tags" });
    const tagLinks = tags.querySelectorAll("a");
    expect(tagLinks).to.have.length(3);
    twd.should(tagLinks[1], "have.attr", "href", "/posts?tag=twd");
  });

  it("links to the dev.to copy for comments", async () => {
    renderRoute(PostPage, { path: "/posts/:slug", url: `/posts/${posts[0].slug}`, loaderData: { post: posts[0], html } });

    const devto = await screenDom.findByRole("link", { name: "dev.to" });
    twd.should(devto, "have.attr", "href", posts[0].devtoUrl!);
  });

  it("marks Spanish posts with an ES badge and lang attribute", async () => {
    const spanish = posts[1];
    renderRoute(PostPage, { path: "/posts/:slug", url: `/posts/${spanish.slug}`, loaderData: { post: spanish, html: "<p>Hola</p>" } });

    const badge = await screenDom.findByTitle("Written in Spanish");
    twd.should(badge, "have.text", "ES");
    const article = await screenDom.findByRole("article");
    twd.should(article, "have.attr", "lang", "es");
    twd.should(await screenDom.findByText("2 jun 2025"), "be.visible");
  });
});
