import { twd, screenDom, userEvent, expect } from "twd-js";
import { beforeEach, describe, it } from "twd-js/runner";
import Home from "~/routes/home";
import { posts, renderRoute, setupReactRoot } from "./utils";

describe("Home page", () => {
  beforeEach(async () => {
    await setupReactRoot();
  });

  it("introduces Kevin and points to TWD", async () => {
    renderRoute(Home, { path: "/", loaderData: { latest: posts, total: 81 } });

    const heading = await screenDom.findByRole("heading", { level: 1 });
    twd.should(heading, "have.text", "Building software with confidence, for developers and their AI assistants.");
    const twdLink = await screenDom.findByRole("link", { name: "What is TWD?" });
    twd.should(twdLink, "have.attr", "href", "https://twd.dev");
    const run = await screenDom.findByRole("figure", { name: /Test run: Kevin Martínez, 5 passing/ });
    twd.should(run, "be.visible");
  });

  it("lists the latest posts with dates and a link to all posts", async () => {
    renderRoute(Home, { path: "/", loaderData: { latest: posts, total: 81 } });

    const postLink = await screenDom.findByRole("link", { name: posts[0].title });
    twd.should(postLink, "have.attr", "href", `/posts/${posts[0].slug}`);
    const date = await screenDom.findByText("19 Apr 2026");
    twd.should(date, "have.attr", "datetime", "2026-04-19");
    const all = await screenDom.findByRole("link", { name: "All 81 posts" });
    twd.should(all, "have.attr", "href", "/posts");
  });

  it("navigates to a post when its title is clicked", async () => {
    renderRoute(Home, { path: "/", loaderData: { latest: posts, total: 81 } });

    await userEvent.click(await screenDom.findByRole("link", { name: posts[0].title }));
    const landed = await screenDom.findByText("navigated away");
    expect(landed).to.not.equal(null);
  });
});
