import { twd, screenDom } from "twd-js";
import { beforeEach, describe, it } from "twd-js/runner";
import About from "~/routes/about";
import { renderRoute, setupReactRoot } from "./utils";

describe("About page", () => {
  beforeEach(async () => {
    await setupReactRoot();
  });

  it("shows the bio and the TWD section", async () => {
    renderRoute(About, { path: "/about" });

    twd.should(await screenDom.findByText("Kevin Julián Martínez Escobar"), "be.visible");
    twd.should(await screenDom.findByText(/it shouldn't change how we validate it/), "be.visible");
    twd.should(await screenDom.findByRole("heading", { name: "Why TWD" }), "be.visible");
  });

  it("links to LinkedIn, GitHub, dev.to and twd.dev", async () => {
    renderRoute(About, { path: "/about" });

    const expected = {
      LinkedIn: "https://www.linkedin.com/in/kevinjmartinez/",
      GitHub: "https://github.com/kevinccbsg",
      "dev.to": "https://dev.to/kevinccbsg",
      "twd.dev": "https://twd.dev",
    };
    const list = await screenDom.findByRole("heading", { name: "Find me elsewhere" });
    const links = list.nextElementSibling!.querySelectorAll("a");
    for (const [name, href] of Object.entries(expected)) {
      const link = [...links].find((a) => a.textContent === name)!;
      twd.should(link, "have.attr", "href", href);
    }
  });
});
