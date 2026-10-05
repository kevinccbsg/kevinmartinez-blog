import { twd, screenDom, userEvent, expect } from "twd-js";
import { beforeEach, describe, it } from "twd-js/runner";
import Posts from "~/routes/posts";
import { posts, renderRoute, setupReactRoot } from "./utils";

describe("Posts page", () => {
  beforeEach(async () => {
    await setupReactRoot();
  });

  it("groups every post by year", async () => {
    renderRoute(Posts, { path: "/posts", loaderData: { posts } });

    for (const year of ["2026", "2025", "2021"]) {
      twd.should(await screenDom.findByRole("heading", { level: 2, name: year }), "be.visible");
    }
    const items = await screenDom.findAllByRole("listitem");
    expect(items).to.have.length(posts.length);
  });

  it("filters by tag from the URL", async () => {
    renderRoute(Posts, { path: "/posts", url: "/posts?tag=twd", loaderData: { posts } });

    const status = await screenDom.findByRole("status");
    twd.should(status, "contain.text", "1 post tagged “twd”");
    twd.should(await screenDom.findByRole("link", { name: posts[0].title }), "be.visible");
    expect(screenDom.queryByRole("link", { name: posts[2].title })).to.equal(null);
  });

  it("filters when a tag is clicked and clears with All", async () => {
    renderRoute(Posts, { path: "/posts", loaderData: { posts } });

    const filters = await screenDom.findByRole("navigation", { name: "Filter by tag" });
    const react = [...filters.querySelectorAll("a")].find((a) => a.textContent === "react")!;
    await userEvent.click(react);
    twd.should(await screenDom.findByRole("status"), "contain.text", "1 post tagged “react”");
    twd.should(react, "have.attr", "aria-current", "page");

    await userEvent.click(await screenDom.findByRole("link", { name: "All" }));
    await twd.wait(50);
    expect(screenDom.queryByRole("status")).to.equal(null);
    expect(await screenDom.findAllByRole("listitem")).to.have.length(posts.length);
  });
});
