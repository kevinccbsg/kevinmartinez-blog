import { twd, screenDom, userEvent, expect } from "twd-js";
import { afterEach, beforeEach, describe, it } from "twd-js/runner";
import { ThemeToggle } from "~/components/theme-toggle";
import { renderRoute, setupReactRoot } from "./utils";

describe("Theme toggle", () => {
  let saved: string | null;

  beforeEach(async () => {
    saved = localStorage.getItem("theme");
    localStorage.setItem("theme", "light");
    document.documentElement.dataset.theme = "light";
    await setupReactRoot();
  });

  afterEach(() => {
    if (saved) localStorage.setItem("theme", saved);
    else localStorage.removeItem("theme");
    delete document.documentElement.dataset.theme;
  });

  it("switches between light and dark and remembers the choice", async () => {
    renderRoute(ThemeToggle, { path: "/" });

    const toggle = await screenDom.findByRole("button", { name: "Switch to dark theme" });
    await userEvent.click(toggle);
    expect(document.documentElement.dataset.theme).to.equal("dark");
    expect(localStorage.getItem("theme")).to.equal("dark");
    twd.should(toggle, "have.attr", "aria-label", "Switch to light theme");

    await userEvent.click(toggle);
    expect(document.documentElement.dataset.theme).to.equal("light");
    expect(localStorage.getItem("theme")).to.equal("light");
  });
});
