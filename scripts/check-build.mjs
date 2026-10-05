// Verifies the static build is crawler-ready: real HTML with meta tags and body text.
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import matter from "gray-matter";

const OUT = "build/client";
const read = (p) => fs.readFile(path.join(OUT, p), "utf8");
let failures = 0;

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failures++;
    console.log(`  ✗ ${name}\n    ${error.message}`);
  }
}

const files = (await fs.readdir("articles")).filter((f) => f.endsWith(".md"));
const articles = await Promise.all(
  files.map(async (f) => ({ slug: f.replace(/\.md$/, ""), ...matter(await fs.readFile(`articles/${f}`, "utf8")) })),
);
const published = articles.filter((a) => a.data.draft !== true);

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const contains = (html, text, label) =>
  assert.ok(html.includes(text) || html.includes(escapeHtml(text)), `${label} not found: ${text.slice(0, 80)}`);

console.log("check-build");

await check("every published article has a prerendered HTML page", async () => {
  const missing = [];
  for (const a of published) {
    await fs.access(path.join(OUT, "posts", a.slug, "index.html")).catch(() => missing.push(a.slug));
  }
  assert.deepEqual(missing, []);
});

const sample = published.find((a) => a.slug === "when-your-mocks-lie-contract-testing-with-twd") ?? published[0];
await check(`article HTML is complete (${sample.slug})`, async () => {
  const html = await read(`posts/${sample.slug}/index.html`);
  contains(html, `<title>${sample.data.title} | Kevin Martínez</title>`, "title");
  contains(html, `<meta name="description" content="${sample.data.description}"`, "meta description");
  contains(html, `<meta property="og:title" content="${sample.data.title}"`, "og:title");
  contains(html, `<link rel="canonical" href="https://www.kevinmartinez.dev/posts/${sample.slug}"`, "canonical");
  const sentence = sample.content
    .split("\n")
    .find((l) => /^[A-Z][^`*_\[\]<>]{60,}$/.test(l.trim()))
    ?.trim()
    .slice(0, 60);
  assert.ok(sentence, "no plain sentence found in sample body");
  contains(html, sentence, "body text");
});

for (const page of ["index.html", "posts/index.html", "about/index.html", "404.html"]) {
  await check(`${page} exists with a <title>`, async () => {
    assert.match(await read(page), /<title>[^<]+<\/title>/);
  });
}

await check("rss.xml lists every post", async () => {
  const xml = await read("rss.xml");
  assert.equal((xml.match(/<item>/g) ?? []).length, published.length);
});

await check("sitemap.xml lists every post", async () => {
  const xml = await read("sitemap.xml");
  assert.equal((xml.match(/<loc>[^<]*\/posts\/[^<]+<\/loc>/g) ?? []).length, published.length);
});

await check("dev-only test page is not shipped", async () => {
  await assert.rejects(fs.access(path.join(OUT, "testing")));
});

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll build checks passed");
