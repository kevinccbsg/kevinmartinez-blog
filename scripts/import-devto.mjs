// Downloads every published dev.to article by USERNAME into articles/<slug>.md.
// Public API, no key needed. Re-runnable: existing files are overwritten.
//
//   npm run import:devto            # all articles
//   npm run import:devto -- <slug>  # only articles whose slug contains <slug>
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const USERNAME = "kevinccbsg";
const API = "https://dev.to/api";
const OUT = path.resolve("articles");
// Sibling repo where the drafts live; its descriptions beat dev.to's truncated ones.
const TWD_SOCIAL = path.resolve("../twd-social/articles");
const filter = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 1) {
  const res = await fetch(url, { headers: { Accept: "application/vnd.forem.api-v1+json" } });
  if ((res.status === 429 || res.status >= 500) && attempt <= 5) {
    await sleep(2000 * attempt);
    return get(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

// dev.to slugs end with a random suffix: "my-post-2e58" -> "my-post"
const cleanSlug = (slug) => slug.replace(/-[a-z0-9]{2,5}$/, "");

async function loadSocialDescriptions() {
  const byTitle = new Map();
  const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".md")) {
        const data = readLooseFrontmatter(await fs.readFile(full, "utf8"));
        if (data.title && data.description) byTitle.set(normalize(data.title), data.description);
      }
    }
  };
  await walk(TWD_SOCIAL);
  return byTitle;
}

// dev.to accepts frontmatter that isn't strict YAML (e.g. unquoted colons in titles),
// so read the two fields we need line by line.
function readLooseFrontmatter(raw) {
  const block = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const data = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^(title|description):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, "$2");
  }
  return data;
}

const normalize = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

// First real paragraph of the body, plain text, cut at a word boundary.
function excerpt(body, max = 160) {
  const paragraph = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|```|!\[|<|\{%|>|\||-{3}|\*\*\*)/.test(p) && p.length > 60);
  if (!paragraph) return null;
  const text = paragraph
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max - 1)).replace(/[,;:.\s]+$/, "") + "…";
}

function convertLiquid(body, articleUrl) {
  return body.replace(/\{%\s*(\w+)\s+([^%]*?)\s*%\}/g, (match, tag, arg) => {
    const value = arg.trim().replace(/^["']|["']$/g, "");
    switch (tag) {
      case "youtube": {
        const id = value.split(/[?&\s]/)[0];
        return `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allowfullscreen></iframe></div>`;
      }
      case "embed":
      case "link":
      case "github":
      case "twitter":
      case "codepen":
      case "stackblitz":
      case "codesandbox": {
        const url = /^https?:\/\//.test(value)
          ? value.split(/\s/)[0]
          : tag === "github" ? `https://github.com/${value.split(/\s/)[0]}` : null;
        return url ? `[${url}](${url})` : "";
      }
      case "agent_session":
        return `[View the agent session on dev.to](${articleUrl})`;
      default:
        return match;
    }
  });
}

function rewriteOwnLinks(body, slugMap) {
  return body.replace(
    new RegExp(`https://dev\\.to/${USERNAME}/([a-z0-9-]+)`, "g"),
    (url, slug) => (slugMap.has(slug) ? `/posts/${slugMap.get(slug)}` : url),
  );
}

const list = [];
for (let page = 1; ; page++) {
  const batch = await get(`${API}/articles?username=${USERNAME}&per_page=100&page=${page}`);
  list.push(...batch);
  if (batch.length < 100) break;
}

const socialDescriptions = await loadSocialDescriptions();
const slugMap = new Map(list.map((a) => [a.slug, cleanSlug(a.slug)]));
const targets = filter ? list.filter((a) => a.slug.includes(filter)) : list;
await fs.mkdir(OUT, { recursive: true });

let created = 0;
let updated = 0;
for (const summary of targets) {
  const article = await get(`${API}/articles/${summary.id}`);
  const slug = slugMap.get(article.slug);
  const file = path.join(OUT, `${slug}.md`);

  const body = convertLiquid(rewriteOwnLinks(article.body_markdown, slugMap), article.url).trim() + "\n";
  const description =
    socialDescriptions.get(normalize(article.title)) ??
    (article.description.endsWith("...") ? excerpt(body) : null) ??
    article.description;

  const frontmatter = {
    title: article.title,
    description,
    date: article.published_at.slice(0, 10),
    tags: article.tags ?? article.tag_list,
    ...(article.cover_image && { cover_image: article.cover_image }),
    ...(article.language === "es" && { lang: "es" }),
    devto_url: article.url,
  };

  const exists = await fs.access(file).then(() => true, () => false);
  await fs.writeFile(file, matter.stringify(body, frontmatter));
  exists ? updated++ : created++;
  console.log(`${exists ? "updated" : "created"}  articles/${slug}.md`);
  await sleep(400);
}

console.log(`\nDone: ${created} created, ${updated} updated (${targets.length} articles).`);
